import { z } from 'zod';

// Home Page Cards Schema - Allow empty strings or valid URLs
const homePageCardsSchema = z.object({
  instantConsultationCard: z.object({
    image: z.string()
      .refine(
        (val) => val === '' || val.startsWith('http://') || val.startsWith('https://'),
        { message: 'Image must be empty or a valid URL' }
      )
      .optional(),
  }).optional(),
  popularSpecialistCard: z.object({
    image: z.string()
      .refine(
        (val) => val === '' || val.startsWith('http://') || val.startsWith('https://'),
        { message: 'Image must be empty or a valid URL' }
      )
      .optional(),
  }).optional(),
}).optional();

// Very lenient schema that accepts any payload but validates homePageCards if present
const updatePlatformSettingsSchema = z.object({
  homePageCards: homePageCardsSchema,
}).passthrough();

export const settingsValidation = {
  updatePlatformSettingsSchema,
};
