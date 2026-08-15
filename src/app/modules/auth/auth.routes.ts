import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { AuthController } from './auth.controller';

const router = express.Router();

router.post(
  '/register',
  validateRequest(AuthValidation.registerZodSchema),
  AuthController.register
);

router.post(
  '/verify-registration',
  AuthController.verifyRegistrationOtp
);

router.post(
  '/login',
  validateRequest(AuthValidation.loginZodSchema),
  AuthController.login
);

router.post(
  '/google',
  AuthController.googleLogin
);
router.post(
  '/forgot-password',
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  AuthController.resetPassword
);

router.post(
  '/refresh-token',
  AuthController.refreshToken
);

export const AuthRouters = router;
