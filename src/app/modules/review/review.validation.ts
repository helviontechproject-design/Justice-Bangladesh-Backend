import { z } from 'zod';

export const createReviewZod = z.object({
  lawyerId: z.string().min(1, 'Lawyer ID is required'),
  rating: z.coerce.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().optional(),
});

export const updateReviewZod = z.object({
  rating: z.coerce.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewZod>;
export type UpdateReviewInput = z.infer<typeof updateReviewZod>;
