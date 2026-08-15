import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';

const createSavedItem = async (userId: string, payload: any) => {
  payload.userId = userId;

  const savedItem = await prisma.savedItem.create({
    data: payload,
  });

  return savedItem;
};

const getAllSavedItems = async (userId: string, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } = options;

  const result = await prisma.savedItem.findMany({
    where: {
      userId,
    },
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? { [sortBy]: sortOrder }
        : { createdAt: 'desc' },
  });

  const total = await prisma.savedItem.count({
    where: {
      userId,
    },
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

const deleteSavedItem = async (id: string, userId: string) => {
  const isExist = await prisma.savedItem.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Saved item not found');
  }

  if (isExist.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this saved item');
  }

  const result = await prisma.savedItem.delete({
    where: { id },
  });

  return result;
};

export const SavedItemService = {
  createSavedItem,
  getAllSavedItems,
  deleteSavedItem,
};
