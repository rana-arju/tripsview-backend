import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { SavedItemValidation } from './savedItems.validation';
import { SavedItemController } from './savedItems.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

router.post(
  '/',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(SavedItemValidation.createSavedItemZodSchema),
  SavedItemController.createSavedItem
);

router.get(
  '/',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  SavedItemController.getAllSavedItems
);

router.delete(
  '/:id',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  SavedItemController.deleteSavedItem
);

export const SavedItemRouters = router;
