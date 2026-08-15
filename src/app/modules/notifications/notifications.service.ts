import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../lib/prisma';
import { io } from '../../../server';
import { sendPushNotification } from '../../../lib/firebase';

const createNotification = async (payload: any) => {
  const notification = await prisma.notification.create({
    data: payload,
  });

  // Emit real-time via Socket.IO to the recipient's room
  if (io) {
    io.to(payload.userId).emit('new-notification', notification);
  }

  // Attempt to send push notification via FCM
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { fcmToken: true }
    });

    if (user?.fcmToken) {
      await sendPushNotification(user.fcmToken, {
        notification: {
          title: payload.title || 'New Notification',
          body: typeof payload.body === 'string' ? payload.body : 'You have a new update in TripsView',
        },
        data: {
          notificationId: notification.id,
          type: payload.type || 'system',
          refId: payload.refId || '',
          refType: payload.refType || '',
        }
      });
    }
  } catch (err) {
    console.error('Failed to send push notification', err);
  }

  return notification;
};

const getMyNotifications = async (userId: string, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } = options;

  const result = await prisma.notification.findMany({
    where: { userId },
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? { [sortBy]: sortOrder }
        : { createdAt: 'desc' },
  });

  const total = await prisma.notification.count({ where: { userId } });
  const totalPage = Math.ceil(total / limit);

  return {
    meta: { total, page, limit, totalPage },
    data: result,
  };
};

const getNotificationById = async (id: string, userId: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  if (notification.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }

  return notification;
};

const getUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: { userId, read: false },
  });
  return count;
};

const markAsRead = async (id: string, userId: string) => {
  const isExist = await prisma.notification.findUnique({ where: { id } });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  if (isExist.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this notification');
  }

  const result = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  return result;
};

const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return { success: true };
};

const updateNotification = async (id: string, userId: string, payload: any) => {
  const isExist = await prisma.notification.findUnique({ where: { id } });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  if (isExist.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this notification');
  }

  const result = await prisma.notification.update({
    where: { id },
    data: payload,
  });

  return result;
};

const deleteNotification = async (id: string, userId: string) => {
  const isExist = await prisma.notification.findUnique({ where: { id } });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  if (isExist.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this notification');
  }

  const result = await prisma.notification.delete({ where: { id } });
  return result;
};

export const NotificationService = {
  createNotification,
  getMyNotifications,
  getNotificationById,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  updateNotification,
  deleteNotification,
};
