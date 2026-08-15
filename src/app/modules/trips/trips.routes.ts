import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { TripValidation } from './trips.validation';
import { TripController } from './trips.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

router.post(
  '/',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(TripValidation.createTripZodSchema),
  TripController.createTrip
);

router.get(
  '/',
  TripController.getAllTrips
);

router.get(
  '/:id',
  TripController.getTripById
);

router.patch(
  '/:id',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(TripValidation.updateTripZodSchema),
  TripController.updateTrip
);

router.delete(
  '/:id',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  TripController.deleteTrip
);

export const TripRouters = router;
