import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../errors/ApiError';
import { jwtHelpers } from '../utils/jwtHelpers';
import prisma from '../lib/prisma';
import { Role } from '@prisma/client';

const auth = (...requiredRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token = req.headers.authorization;
      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized');
      }
      if (token.startsWith('Bearer ')) {
        token = token.substring(7);
      }
      
      let verifiedUser = null;

      try {
        verifiedUser = jwtHelpers.verifyToken(token, config.jwt.access_secret as Secret);
      } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
      }

      const { id, role } = verifiedUser;

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
      }

      if (user.status === 'SUSPENDED') {
        throw new ApiError(httpStatus.FORBIDDEN, 'User is suspended');
      }

      if (user.status === 'DELETED') {
        throw new ApiError(httpStatus.FORBIDDEN, 'User is deleted');
      }

      if (requiredRoles.length && !requiredRoles.includes(role as Role)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
      }
      
      req.user = user;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
