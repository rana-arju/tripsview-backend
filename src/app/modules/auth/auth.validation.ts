import { z } from 'zod';

const loginZodSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

const registerZodSchema = z.object({
  body: z.object({
    displayName: z.string(),
    username: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const AuthValidation = {
  loginZodSchema,
  registerZodSchema,
};
