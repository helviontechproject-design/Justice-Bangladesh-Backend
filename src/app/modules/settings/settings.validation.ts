import { z } from 'zod';

const updatePlatformSettingsSchema = z
  .object({
    platformFee: z.any().optional(),
    payout: z.any().optional(),
    payment: z.any().optional(),
    general: z.any().optional(),
    socialLinks: z.any().optional(),
    contacts: z.any().optional(),
    seo: z.any().optional(),
    whatsapp: z.any().optional(),
    homePageCards: z
      .object({
        instantConsultationCard: z
          .object({
            image: z.string().optional(),
          })
          .optional(),
        popularSpecialistCard: z
          .object({
            image: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough() // Allow any other fields
  .strict(false);

export const settingsValidation = {
  updatePlatformSettingsSchema,
};
