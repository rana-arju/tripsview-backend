import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { NotificationService } from '../notifications/notifications.service';

const createReview = async (userId: string, payload: any) => {
  payload.userId = userId;

  let finalTargetId = payload.targetId;

  if (payload.customName) {
    const newListing = await prisma.listing.create({
      data: {
        title: payload.customName,
        type: 'Other',
        description: 'User added place',
        location: 'Unknown',
        ownerId: userId,
      }
    });
    finalTargetId = newListing.id;
    delete payload.customName;
  } else {
    // Verify the listing exists before trying to link it
    const existingListing = await prisma.listing.findUnique({
      where: { id: finalTargetId }
    });
    
    if (!existingListing) {
      throw new ApiError(httpStatus.BAD_REQUEST, "The selected place does not exist in the database.");
    }
  }

  // Remove the random targetId from payload if it's there
  delete payload.targetId;

  const review = await prisma.review.create({
    data: {
      ...payload,
      targetId: finalTargetId,
    },
    include: {
      user: {
        select: { id: true, displayName: true, username: true, avatar: true },
      },
      listing: {
        select: { id: true, title: true, ownerId: true },
      },
    },
  });

  // Notify the listing owner (skip if reviewer is owner)
  if (review.listing?.ownerId && review.listing.ownerId !== userId) {
    await NotificationService.createNotification({
      userId: review.listing.ownerId,
      title: 'New Review',
      body: `${review.user.displayName} left a ${payload.rating}-star review on ${review.listing.title}`,
      type: 'review',
      refId: review.id,
      refType: 'review',
      actorId: userId,
      actorName: review.user.displayName,
      actorAvatar: review.user.avatar,
    }).catch(err => console.error('Notification error:', err));
  }

  return review;
};

const getAllReviews = async (filters: any, options: any) => {
  const { targetId, userId, username } = filters;
  const { page, limit, skip, sortBy, sortOrder } = options;

  const andConditions: Prisma.ReviewWhereInput[] = [];

  if (targetId) {
    andConditions.push({
      targetId,
    });
  }

  if (userId) {
    andConditions.push({
      userId,
    });
  }

  if (username) {
    andConditions.push({
      user: {
        username,
      },
    });
  }

  const whereConditions: Prisma.ReviewWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.review.findMany({
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
      listing: {
        select: {
          id: true,
          title: true,
          type: true,
          images: true,
        },
      },
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
      reactions: true,
    },
  });

  const total = await prisma.review.count({
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

const getReviewById = async (id: string) => {
  const review = await prisma.review.findUnique({
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
      listing: {
        select: {
          id: true,
          title: true,
          type: true,
          images: true,
        },
      },
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
      reactions: true,
    },
  });

  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  }

  return review;
};

const updateReview = async (id: string, userId: string, payload: any) => {
  const isExist = await prisma.review.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  }

  if (isExist.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this review');
  }

  const result = await prisma.review.update({
    where: { id },
    data: payload,
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

  return result;
};

const deleteReview = async (id: string, userId: string, role: string) => {
  const isExist = await prisma.review.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  }

  if (isExist.userId !== userId && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this review');
  }

  const result = await prisma.review.delete({
    where: { id },
  });

  return result;
};

const replyToReview = async (reviewId: string, userId: string, payload: { reply: string }) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  }

  const listing = await prisma.listing.findUnique({
    where: { id: review.targetId },
  });

  if (!listing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Listing not found');
  }

  if (listing.ownerId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the listing owner can reply to reviews');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: { reply: payload.reply },
  });

  return updatedReview;
};

const getReviewComments = async (reviewId: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');

  const comments = await prisma.comment.findMany({
    where: { 
      reviewId, 
      OR: [{ parentId: null }, { parentId: { isSet: false } }]
    },
    include: {
      user: { select: { id: true, displayName: true, username: true, avatar: true } },
      replies: {
        include: {
          user: { select: { id: true, displayName: true, username: true, avatar: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return comments;
};

const addReviewComment = async (reviewId: string, userId: string, content: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');

  const comment = await prisma.comment.create({
    data: { reviewId, userId, content },
    include: {
      user: { select: { id: true, displayName: true, username: true, avatar: true } },
    },
  });

  return comment;
};

const toggleReviewReaction = async (reviewId: string, userId: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');

  const existingReaction = await prisma.reaction.findFirst({
    where: { reviewId, userId },
  });

  if (existingReaction) {
    await prisma.reaction.delete({ where: { id: existingReaction.id } });
    const count = await prisma.reaction.count({ where: { reviewId } });
    return { status: 'removed', count };
  } else {
    await prisma.reaction.create({ data: { reviewId, userId, type: 'LIKE' } });
    const count = await prisma.reaction.count({ where: { reviewId } });
    return { status: 'added', count };
  }
};

export const ReviewService = {
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
