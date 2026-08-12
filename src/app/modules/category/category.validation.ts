import { z } from 'zod';

const booleanField = z.union([z.boolean(), z.string().transform((v) => v === 'true')]);

// Slug validation: allows any non-whitespace characters (including Unicode), numbers, and hyphens
const isValidSlug = (slug: string) => {
  // Allow letters (any language), numbers, and hyphens, but no spaces or special symbols
  // This pattern matches: word characters (including Unicode) and hyphens
  return /^[\w-]+$/u.test(slug);
};

export const categoryZ = z.object({
  name: z
    .string()
    .min(2, 'name at least 2 chars')
    .max(100, 'name max 100 chars'),
  slug: z
    .string()
    .refine(isValidSlug, 'invalid slug (use letters, numbers and hyphens)')
    .optional(),
  imageUrl: z.string().url('invalid url').optional(),
  isFeatured: booleanField.optional(),
  isActive: booleanField.optional(),
  consultationFee: z.union([z.number(), z.string().transform(Number)]).optional(),
});


export const updateCategoryZ = categoryZ.partial();

export type CategoryInput = z.infer<typeof categoryZ>;

