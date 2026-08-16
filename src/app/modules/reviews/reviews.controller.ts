import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { ReviewService } from './reviews.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    req.body.images = (req.files as any[]).map((file) => file.path);
  } else {
    req.body.images = [];
  }

  const result = await ReviewService.createReview(req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    targetId: req.query.targetId,
    userId: req.query.userId,
    username: req.query.username,
  };

  const options = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    skip: (Number(req.query.page || 1) - 1) * (Number(req.query.limit || 10)),
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
  };

  const result = await ReviewService.getAllReviews(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reviews retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getReviewById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review retrieved successfully',
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  if (req.files && Array.isArray(req.files)) {
    req.body.images = (req.files as any[]).map((file) => file.path);
  }

  const result = await ReviewService.updateReview(req.params.id, req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review updated successfully',
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.deleteReview(req.params.id, req.user.id, req.user.role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review deleted successfully',
    data: result,
  });
});

const replyToReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.replyToReview(req.params.id, req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reply added successfully',
    data: result,
  });
});

const getReviewComments = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getReviewComments(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review comments retrieved successfully',
    data: result,
  });
});

const addReviewComment = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.addReviewComment(req.params.id, req.user.id, req.body.content);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Comment added successfully',
    data: result,
  });
});

const toggleReviewReaction = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.toggleReviewReaction(req.params.id, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reaction toggled successfully',
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  replyToReview,
  getReviewComments,
  addReviewComment,
  toggleReviewReaction,
};
