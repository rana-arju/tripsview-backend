import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { UserService } from './users.service';

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getMyProfile(req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateMyProfile(req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile updated successfully',
    data: result,
  });
});

const getUserProfileByUsername = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUserProfileByUsername(req.params.username);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

const followUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.followUser(req.user.id, req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User followed successfully',
    data: result,
  });
});

const unfollowUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.unfollowUser(req.user.id, req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User unfollowed successfully',
    data: result,
  });
});

const getUserFeed = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const type = req.query.type as string;
  const sort = req.query.sort as string;

  const result = await UserService.getUserFeed(req.params.username, page, limit, type, sort);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User feed retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

export const UserController = {
  getMyProfile,
  updateMyProfile,
  getUserProfileByUsername,
  followUser,
  unfollowUser,
  getUserFeed,
};
