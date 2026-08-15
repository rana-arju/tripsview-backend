import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { ListingService } from './listings.service';

const createListing = catchAsync(async (req: Request, res: Response) => {
  const result = await ListingService.createListing(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Listing created successfully',
    data: result,
  });
});

const getAllListings = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    type: req.query.type || req.query.category,
    search: req.query.search,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    minRating: req.query.minRating,
  };

  const options = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    skip: (Number(req.query.page || 1) - 1) * (Number(req.query.limit || 10)),
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
  };

  const result = await ListingService.getAllListings(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Listings retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getListingById = catchAsync(async (req: Request, res: Response) => {
  const result = await ListingService.getListingById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Listing retrieved successfully',
    data: result,
  });
});

const updateListing = catchAsync(async (req: Request, res: Response) => {
  const result = await ListingService.updateListing(req.params.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Listing updated successfully',
    data: result,
  });
});

const deleteListing = catchAsync(async (req: Request, res: Response) => {
  const result = await ListingService.deleteListing(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Listing deleted successfully',
    data: result,
  });
});

const claimListing = catchAsync(async (req: Request, res: Response) => {
  const result = await ListingService.claimListing(req.params.id, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Listing claimed successfully',
    data: result,
  });
});

export const ListingController = {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
  claimListing,
};
