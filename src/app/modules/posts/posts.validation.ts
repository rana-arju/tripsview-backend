import { z } from 'zod';

const createPostZodSchema = z.object({
  body: z.object({
    content: z.string().optional(),
    images: z.array(z.string()).optional(),
    location: z.string().optional(),
    category: z.string().optional(),
  }),
});

const updatePostZodSchema = z.object({
  body: z.object({
    content: z.string().optional(),
    images: z.array(z.string()).optional(),
    location: z.string().optional(),
    category: z.string().optional(),
  }),
});

export const PostValidation = {
  createPostZodSchema,
  updatePostZodSchema,
};
