import { z } from 'zod';

const createListingZodSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: 'Title is required',
    }),
    description: z.string({
      required_error: 'Description is required',
    }),
    type: z.string({
      required_error: 'Type is required',
    }),
    location: z.string({
      required_error: 'Location is required',
    }),
    images: z.array(z.string()).optional(),
    price: z.number().optional(),
    rating: z.number().optional(),
  }),
});

const updateListingZodSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    location: z.string().optional(),
    images: z.array(z.string()).optional(),
    price: z.number().optional(),
    rating: z.number().optional(),
  }),
});

export const ListingValidation = {
  createListingZodSchema,
  updateListingZodSchema,
};
