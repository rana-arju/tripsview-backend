import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { SavedItemService } from './savedItems.service';

const createSavedItem = catchAsync(async (req: Request, res: Response) => {
  const result = await SavedItemService.createSavedItem(req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Item saved successfully',
    data: result,
  });
});

const getAllSavedItems = catchAsync(async (req: Request, res: Response) => {
  const options = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    skip: (Number(req.query.page || 1) - 1) * (Number(req.query.limit || 10)),
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
  };

  const result = await SavedItemService.getAllSavedItems(req.user.id, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Saved items retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const deleteSavedItem = catchAsync(async (req: Request, res: Response) => {
  const result = await SavedItemService.deleteSavedItem(req.params.id, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Saved item deleted successfully',
    data: result,
  });
});

export const SavedItemController = {
  createSavedItem,
  getAllSavedItems,
  deleteSavedItem,
};
