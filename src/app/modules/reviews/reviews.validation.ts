import { z } from 'zod';

const createReviewZodSchema = z.object({
  body: z.object({
    targetId: z.string({
      required_error: 'Target ID is required',
    }),
    rating: z.number({
      required_error: 'Rating is required',
    }),
    content: z.string({
      required_error: 'Content is required',
    }),
    customName: z.string().optional(),
    images: z.array(z.string()).optional(),
  }),
});

const updateReviewZodSchema = z.object({
  body: z.object({
    rating: z.number().optional(),
    content: z.string().optional(),
    images: z.array(z.string()).optional(),
  }),
});

export const ReviewValidation = {
  createReviewZodSchema,
  updateReviewZodSchema,
};
