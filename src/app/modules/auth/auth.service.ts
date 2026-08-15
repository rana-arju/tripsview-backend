import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../lib/prisma';
import bcrypt from 'bcrypt';
import { jwtHelpers } from '../../utils/jwtHelpers';
import config from '../../../config';
import { Secret } from 'jsonwebtoken';
import { sendEmail } from '../../../lib/sendEmail';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(config.google.clientId);

const register = async (payload: any) => {
  const isExistUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isExistUser) {
    // If the user exists but is still PENDING, we can resend OTP or just fail
    // For simplicity, let's just fail if email exists. They can use forgot password or resend OTP if implemented.
    if (isExistUser.status === 'ACTIVE') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User already exists');
    }
  }

  if (payload.password) {
    payload.password = await bcrypt.hash(
      payload.password,
      Number(config.bcrypt_salt_rounds)
    );
  }

  payload.status = 'PENDING';

  let user = isExistUser;
  if (!user) {
    user = await prisma.user.create({
      data: payload,
    });
  } else {
    // Update existing pending user with new payload
    user = await prisma.user.update({
      where: { id: user.id },
      data: payload,
    });
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + Number(config.otp_expiry_time) * 60 * 1000);

  // Clear old OTPs for user
  await prisma.oTP.deleteMany({
    where: { userId: user.id },
  });

  await prisma.oTP.create({
    data: {
      userId: user.id,
      otpCode,
      expiry,
    },
  });

  await sendEmail(
    user.email,
    'Verify Your Registration - TripsView',
    `<p>Your registration verification code is: <strong>${otpCode}</strong></p>
     <p>This code expires in ${config.otp_expiry_time} minutes.</p>`
  );

  return {
    message: 'OTP sent to email. Please verify to complete registration.',
  };
};

const verifyRegistrationOtp = async (payload: { email: string; otp: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const validOtp = await prisma.oTP.findFirst({
    where: {
      userId: user.id,
      otpCode: payload.otp,
      expiry: {
        gte: new Date(),
      },
    },
  });

  if (!validOtp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
  }

  // Activate user
  await prisma.user.update({
    where: { id: user.id },
    data: { status: 'ACTIVE' },
  });

  // Delete used OTP
  await prisma.oTP.delete({
    where: { id: validOtp.id },
  });

  // Generate tokens
  const accessToken = jwtHelpers.createToken(
    { id: user.id, role: user.role },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string
  );

  const refreshToken = jwtHelpers.createToken(
    { id: user.id, role: user.role },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string
  );

  const { password, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
};

const login = async (payload: any) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.status === 'PENDING') {
    throw new ApiError(httpStatus.FORBIDDEN, 'User registration is not verified');
  }
  
  if (user.status === 'SUSPENDED') {
    throw new ApiError(httpStatus.FORBIDDEN, 'User is suspended');
  }
  
  if (user.status === 'DELETED') {
    throw new ApiError(httpStatus.FORBIDDEN, 'User is deleted');
  }

  const isPasswordMatch = await bcrypt.compare(
    payload.password,
    user.password as string
  );

  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid password');
  }

  const accessToken = jwtHelpers.createToken(
    { id: user.id, role: user.role },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string
  );

  const refreshToken = jwtHelpers.createToken(
    { id: user.id, role: user.role },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  };
};

const refreshToken = async (token: string) => {
  let verifiedToken = null;
  try {
    verifiedToken = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_secret as Secret
    );
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }

  const { id } = verifiedToken;

  const isUserExist = await prisma.user.findUnique({
    where: { id },
  });

  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }

  const newAccessToken = jwtHelpers.createToken(
    { id: isUserExist.id, role: isUserExist.role },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string
  );

  return {
    accessToken: newAccessToken,
  };
};

const forgotPassword = async (payload: { email: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + Number(config.otp_expiry_time) * 60 * 1000);

  await prisma.oTP.deleteMany({
    where: { userId: user.id },
  });

  await prisma.oTP.create({
    data: { userId: user.id, otpCode, expiry },
  });

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?email=${user.email}&otp=${otpCode}`;

  await sendEmail(
    user.email,
    'Password Reset - TripsView',
    `<p>Your password reset OTP is: <strong>${otpCode}</strong></p>
     <p>Or click this link to reset: <a href="${resetLink}">${resetLink}</a></p>
     <p>This code expires in ${config.otp_expiry_time} minutes.</p>`
  );

  return { message: 'OTP sent to email successfully' };
};

const resetPassword = async (payload: any) => {
  const { email, otp, newPassword } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const validOtp = await prisma.oTP.findFirst({
    where: {
      userId: user.id,
      otpCode: otp,
      expiry: { gte: new Date() },
    },
  });

  if (!validOtp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
  }

  const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await prisma.oTP.delete({
    where: { id: validOtp.id },
  });

  const accessToken = jwtHelpers.createToken(
    { id: user.id, role: user.role },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string
  );

  const refreshToken = jwtHelpers.createToken(
    { id: user.id, role: user.role },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string
  );

  const { password, ...userWithoutPassword } = user;

  return { 
    message: 'Password reset successful',
    accessToken,
    refreshToken,
    user: userWithoutPassword
  };
};

const googleLogin = async (payload: { googleAccessToken: string; role?: string; businessType?: string; businessName?: string }) => {
  // Fetch user info from Google using the access token
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${payload.googleAccessToken}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Google token');
  }

  const payloadData = await response.json();
  if (!payloadData || !payloadData.email) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Google token data');
  }

  const { email, name, picture, sub: googleId } = payloadData;

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    // If user exists, just log them in
    if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
      throw new ApiError(httpStatus.FORBIDDEN, `User is ${user.status.toLowerCase()}`);
    }
    
    // If they were PENDING, activate them since Google verified the email
    if (user.status === 'PENDING') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE', googleId, avatar: user.avatar || picture },
      });
    } else if (!user.googleId) {
      // Link google id if not linked yet
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatar: user.avatar || picture },
      });
    }
  } else {
    // User does not exist, create them
    const role = payload.role === 'OWNER' ? 'OWNER' : 'USER';
    
    if (role === 'OWNER') {
      if (!payload.businessType || !payload.businessName) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Business type and name are required for owners');
      }
    }

    user = await prisma.user.create({
      data: {
        email,
        displayName: name || 'Google User',
        username: (name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 10000),
        googleId,
        avatar: picture,
        role,
        status: 'ACTIVE',
        businessType: role === 'OWNER' ? payload.businessType : null,
        businessName: role === 'OWNER' ? payload.businessName : null,
      }
    });
  }

  const accessToken = jwtHelpers.createToken(
    { id: user.id, role: user.role },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string
  );

  const refreshToken = jwtHelpers.createToken(
    { id: user.id, role: user.role },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string
  );

  const { password, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
};

export const AuthService = {
  register,
  verifyRegistrationOtp,
  login,
  googleLogin,
  refreshToken,
  forgotPassword,
  resetPassword,
};
