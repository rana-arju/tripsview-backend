import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { ListingValidation } from './listings.validation';
import { ListingController } from './listings.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

router.post(
  '/',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(ListingValidation.createListingZodSchema),
  ListingController.createListing
);

router.get(
  '/',
  ListingController.getAllListings
);

router.get(
  '/:id',
  ListingController.getListingById
);

router.patch(
  '/:id',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(ListingValidation.updateListingZodSchema),
  ListingController.updateListing
);

router.delete(
  '/:id',
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  ListingController.deleteListing
);

router.post(
  '/:id/claim',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  ListingController.claimListing
);

export const ListingRouters = router;
