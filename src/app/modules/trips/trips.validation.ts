import { z } from 'zod';

const createTripZodSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Name is required',
    }),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    destinations: z.array(z.string()).optional(),
  }),
});

const updateTripZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    destinations: z.array(z.string()).optional(),
  }),
});

export const TripValidation = {
  createTripZodSchema,
  updateTripZodSchema,
};
