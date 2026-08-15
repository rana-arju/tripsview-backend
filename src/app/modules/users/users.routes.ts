import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './users.validation';
import { UserController } from './users.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

router.get(
  '/me',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getMyProfile
);

router.patch(
  '/me',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(UserValidation.updateProfileZodSchema),
  UserController.updateMyProfile
);

router.get(
  '/:username',
  UserController.getUserProfileByUsername
);

router.get(
  '/:username/feed',
  UserController.getUserFeed
);

router.post(
  '/:id/follow',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  UserController.followUser
);

router.post(
  '/:id/unfollow',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  UserController.unfollowUser
);

export const UserRouters = router;
