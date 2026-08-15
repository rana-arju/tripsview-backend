import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { TripService } from './trips.service';

const createTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.createTrip(req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Trip created successfully',
    data: result,
  });
});

const getAllTrips = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    search: req.query.search,
  };

  const options = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    skip: (Number(req.query.page || 1) - 1) * (Number(req.query.limit || 10)),
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
  };

  const result = await TripService.getAllTrips(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trips retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getTripById = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.getTripById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trip retrieved successfully',
    data: result,
  });
});

const updateTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.updateTrip(req.params.id, req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trip updated successfully',
    data: result,
  });
});

const deleteTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.deleteTrip(req.params.id, req.user.id, req.user.role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trip deleted successfully',
    data: result,
  });
});

export const TripController = {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
};
