import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewValidation } from './reviews.validation';
import { ReviewController } from './reviews.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { fileUploader } from '../../middlewares/multerFileUpload';
import parseBodyData from '../../middlewares/parseBodyData';

const router = express.Router();

router.post(
  '/',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  fileUploader.uploadReviewImages,
  parseBodyData,
  validateRequest(ReviewValidation.createReviewZodSchema),
  ReviewController.createReview
);

router.get(
  '/',
  ReviewController.getAllReviews
);

router.get(
  '/:id',
  ReviewController.getReviewById
);

router.patch(
  '/:id',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  fileUploader.uploadReviewImages,
  parseBodyData,
  validateRequest(ReviewValidation.updateReviewZodSchema),
  ReviewController.updateReview
);

router.delete(
  '/:id',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewController.deleteReview
);

router.post(
  '/:id/reply',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewController.replyToReview
);

router.get(
  '/:id/comments',
  ReviewController.getReviewComments
);

router.post(
  '/:id/comment',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewController.addReviewComment
);

router.post(
  '/:id/reaction',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewController.toggleReviewReaction
);

export const ReviewRouters = router;
