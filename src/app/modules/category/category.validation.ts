import { z } from 'zod';

const booleanField = z.union([z.boolean(), z.string().transform((v) => v === 'true')]);

export const categoryZ = z.object({
  name: z
    .string()
    .min(2, 'name at least 2 chars')
    .max(100, 'name max 100 chars'),
  slug: z
    .string()
    .min(1, 'slug cannot be empty')
    .optional(),
  imageUrl: z.string().url('invalid url').optional(),
  isFeatured: booleanField.optional(),
  isActive: booleanField.optional(),
  consultationFee: z.union([z.number(), z.string().transform(Number)]).optional(),
});


export const updateCategoryZ = categoryZ.partial();

export type CategoryInput = z.infer<typeof categoryZ>;

