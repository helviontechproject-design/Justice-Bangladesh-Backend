import { z } from 'zod';

export const createLawyerSpecialtyZod = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(100, 'Title max 100 characters'),
  category: z.string().nonempty('Category is required'),
});

export const updateLawyerSpecialtyZod = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(100, 'Title max 100 characters').optional(),
  icon: z.string().trim().optional(),
  category: z.string().optional(),
});

export type CreateLawyerSpecialtyInput = z.infer<typeof createLawyerSpecialtyZod>;
export type UpdateLawyerSpecialtyInput = z.infer<typeof updateLawyerSpecialtyZod>;
