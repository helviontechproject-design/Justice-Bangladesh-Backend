import { z } from 'zod';

const booleanField = z.union([z.boolean(), z.string().transform((v) => v === 'true')]);

export const createBannerZod = z.object({
  isActive: booleanField.optional().default(true),
  target: z.enum(['client', 'lawyer', 'all']).optional().default('all'),
});

export const updateBannerZod = z.object({
  isActive: booleanField.optional(),
  target: z.enum(['client', 'lawyer', 'all']).optional(),
});

export type CreateBannerInput = z.infer<typeof createBannerZod>;
export type UpdateBannerInput = z.infer<typeof updateBannerZod>;
