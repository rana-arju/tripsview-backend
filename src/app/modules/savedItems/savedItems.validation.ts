import { z } from 'zod';

const createSavedItemZodSchema = z.object({
  body: z.object({
    itemId: z.string({
      required_error: 'Item ID is required',
    }),
    itemType: z.string({
      required_error: 'Item Type is required',
    }),
  }),
});

export const SavedItemValidation = {
  createSavedItemZodSchema,
};
