import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { PostService } from './posts.service';

const createPost = catchAsync(async (req: Request, res: Response) => {
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    req.body.images = (req.files as any[]).map((file) => file.path);
  } else {
    req.body.images = [];
  }

  const result = await PostService.createPost(req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Post created successfully',
    data: result,
  });
});

const getAllPosts = catchAsync(async (req: Request, res: Response) => {
  const options = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    skip: (Number(req.query.page || 1) - 1) * (Number(req.query.limit || 10)),
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
  };

  const result = await PostService.getAllPosts(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Posts retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getPostById = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getPostById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Post retrieved successfully',
    data: result,
  });
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
  if (req.files && Array.isArray(req.files)) {
    req.body.images = (req.files as any[]).map((file) => file.path);
  }

  const result = await PostService.updatePost(req.params.id, req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Post updated successfully',
    data: result,
  });
});

const deletePost = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.deletePost(req.params.id, req.user.id, req.user.role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Post deleted successfully',
    data: result,
  });
});

const addComment = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.addComment(req.params.id, req.user.id, req.body.content);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Comment added successfully',
    data: result,
  });
});

const removeComment = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.removeComment(req.params.commentId, req.user.id, req.user.role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comment removed successfully',
    data: result,
  });
});

const toggleReaction = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.toggleReaction(req.params.id, req.user.id, req.body.type);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reaction updated successfully',
    data: result,
  });
});

const updateComment = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.updateComment(
    req.params.commentId,
    req.user.id,
    req.body.content,
    req.user.role
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comment updated successfully',
    data: result,
  });
});

const replyToComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const result = await PostService.replyToComment(commentId, (req as any).user.id, req.body.content);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Reply added successfully',
    data: result,
  });
});

const toggleCommentReaction = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const result = await PostService.toggleCommentReaction(commentId, (req as any).user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comment reaction toggled successfully',
    data: result,
  });
});

const getPostComments = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getPostComments(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comments fetched successfully',
    data: result,
  });
});

export const PostController = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  addComment,
  removeComment,
  toggleReaction,
  updateComment,
  replyToComment,
  toggleCommentReaction,
  getPostComments,
};
