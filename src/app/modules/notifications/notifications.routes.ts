import express from 'express';
import { NotificationController } from './notifications.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

// Specific routes MUST come before /:id
router.get(
  '/unread-count',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  NotificationController.getUnreadCount
);

router.post(
  '/mark-all-read',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  NotificationController.markAllAsRead
);

router.post(
  '/',
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  NotificationController.createNotification
);

router.get(
  '/',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  NotificationController.getMyNotifications
);

router.get(
  '/:id',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  NotificationController.getNotificationById
);

router.patch(
  '/:id/read',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  NotificationController.markAsRead
);

router.patch(
  '/:id',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  NotificationController.updateNotification
);

router.delete(
  '/:id',
  auth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  NotificationController.deleteNotification
);

export const NotificationRouters = router;
