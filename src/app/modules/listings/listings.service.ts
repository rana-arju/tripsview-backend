import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';

const createListing = async (payload: any) => {
  const listing = await prisma.listing.create({
    data: payload,
  });
  return listing;
};

const getAllListings = async (filters: any, options: any) => {
  const { type, search, minPrice, maxPrice, minRating, ownerId, username } = filters;
  const { page, limit, skip, sortBy, sortOrder } = options;

  const andConditions: Prisma.ListingWhereInput[] = [];

  if (search) {
    andConditions.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  if (type && type.toLowerCase() !== 'all') {
    andConditions.push({
      type: { equals: type, mode: 'insensitive' },
    });
  }

  if (ownerId) {
    andConditions.push({ ownerId });
  }

  if (username) {
    andConditions.push({
      owner: {
        username,
      },
    });
  }

  if (minPrice) {
    andConditions.push({
      price: { gte: Number(minPrice) },
    });
  }

  if (maxPrice) {
    andConditions.push({
      price: { lte: Number(maxPrice) },
    });
  }

  if (minRating) {
    andConditions.push({
      rating: { gte: Number(minRating) },
    });
  }

  const whereConditions: Prisma.ListingWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.listing.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? { [sortBy]: sortOrder }
        : { createdAt: 'desc' },
  });

  const total = await prisma.listing.count({
    where: whereConditions,
  });

  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      total,
      page,
      limit,
      totalPage,
    },
    data: result,
  };
};

const getListingById = async (id: string) => {
  const listing = await prisma.listing.findUnique({
    where: { id },
  });

  if (!listing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Listing not found');
  }

  return listing;
};

const updateListing = async (id: string, payload: any) => {
  const isExist = await prisma.listing.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Listing not found');
  }

  const result = await prisma.listing.update({
    where: { id },
    data: payload,
  });

  return result;
};

const deleteListing = async (id: string) => {
  const isExist = await prisma.listing.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Listing not found');
  }

  const result = await prisma.listing.delete({
    where: { id },
  });

  return result;
};

const claimListing = async (id: string, userId: string) => {
  const listing = await prisma.listing.findUnique({
    where: { id },
  });

  if (!listing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Listing not found');
  }

  if (listing.ownerId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Listing is already claimed');
  }

  const result = await prisma.listing.update({
    where: { id },
    data: { ownerId: userId },
  });

  return result;
};

export const ListingService = {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
  claimListing,
};
