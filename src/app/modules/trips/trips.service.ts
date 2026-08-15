import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';

const createTrip = async (userId: string, payload: any) => {
  payload.userId = userId;

  if (payload.startDate) {
    payload.startDate = new Date(payload.startDate);
  }

  if (payload.endDate) {
    payload.endDate = new Date(payload.endDate);
  }

  const trip = await prisma.trip.create({
    data: payload,
  });
  return trip;
};

const getAllTrips = async (filters: any, options: any) => {
  const { search } = filters;
  const { page, limit, skip, sortBy, sortOrder } = options;

  const andConditions: Prisma.TripWhereInput[] = [];

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { destinations: { hasSome: [search] } },
      ],
    });
  }

  const whereConditions: Prisma.TripWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.trip.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? { [sortBy]: sortOrder }
        : { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  const total = await prisma.trip.count({
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

const getTripById = async (id: string) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  if (!trip) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trip not found');
  }

  return trip;
};

const updateTrip = async (id: string, userId: string, payload: any) => {
  const isExist = await prisma.trip.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trip not found');
  }

  if (isExist.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this trip');
  }

  if (payload.startDate) {
    payload.startDate = new Date(payload.startDate);
  }

  if (payload.endDate) {
    payload.endDate = new Date(payload.endDate);
  }

  const result = await prisma.trip.update({
    where: { id },
    data: payload,
  });

  return result;
};

const deleteTrip = async (id: string, userId: string, role: string) => {
  const isExist = await prisma.trip.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trip not found');
  }

  if (isExist.userId !== userId && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this trip');
  }

  const result = await prisma.trip.delete({
    where: { id },
  });

  return result;
};

export const TripService = {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
};
