import { z } from 'zod';

const updateProfileZodSchema = z.object({
  body: z.object({
    displayName: z.string().optional(),
    username: z.string().optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    coverPhoto: z.string().optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    interests: z.array(z.string()).optional(),
  }),
});

export const UserValidation = {
  updateProfileZodSchema,
};
