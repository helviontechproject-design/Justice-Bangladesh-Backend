import { z } from 'zod';

// Very lenient schema that accepts any payload
const updatePlatformSettingsSchema = z.object({}).passthrough();

export const settingsValidation = {
  updatePlatformSettingsSchema,
};
