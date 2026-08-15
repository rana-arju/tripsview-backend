import { z } from 'zod';

const createNotificationZodSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: 'User ID is required',
    }),
    title: z.string({
      required_error: 'Title is required',
    }),
    body: z.string({
      required_error: 'Body is required',
    }),
  }),
});

const updateNotificationZodSchema = z.object({
  body: z.object({
    read: z.boolean({
      required_error: 'Read status is required',
    }),
  }),
});

export const NotificationValidation = {
  createNotificationZodSchema,
  updateNotificationZodSchema,
};
