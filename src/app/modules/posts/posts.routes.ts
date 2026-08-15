import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { PostValidation } from './posts.validation';
import { PostController } from './posts.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { fileUploader } from '../../middlewares/multerFileUpload';
import parseBodyData from '../../middlewares/parseBodyData';

const router = express.Router();

router.post(
  '/',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  fileUploader.uploadPostImages,
  parseBodyData,
  validateRequest(PostValidation.createPostZodSchema),
  PostController.createPost
);

router.get(
  '/',
  PostController.getAllPosts
);

router.get(
  '/:id',
  PostController.getPostById
);

router.get(
  '/:id/comments',
  PostController.getPostComments
);

router.patch(
  '/:id',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  fileUploader.uploadPostImages,
  parseBodyData,
  validateRequest(PostValidation.updatePostZodSchema),
  PostController.updatePost
);

router.delete(
  '/:id',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PostController.deletePost
);

// Specific routes first
router.delete(
  '/comment/:commentId',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PostController.removeComment
);

router.patch(
  '/comment/:commentId',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PostController.updateComment
);

router.post(
  '/comment/:commentId/reply',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PostController.replyToComment
);

router.post(
  '/comment/:commentId/reaction',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PostController.toggleCommentReaction
);

// Dynamic parameter routes later
router.post(
  '/:id/comment',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PostController.addComment
);

router.post(
  '/:id/reaction',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PostController.toggleReaction
);

export const PostRouters = router;
