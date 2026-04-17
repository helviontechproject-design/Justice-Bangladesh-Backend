import { z } from 'zod';

export const serviceZ = z.object({
  name: z.string().min(2, 'name at least 2 chars').max(100, 'name max 100 chars'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'invalid slug').optional(),
  price: z.coerce.number().min(0).optional(),
  imageUrl: z.string().url('invalid url').optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const updateServiceZ = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  imageUrl: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CategoryInput = z.infer<typeof serviceZ>;
