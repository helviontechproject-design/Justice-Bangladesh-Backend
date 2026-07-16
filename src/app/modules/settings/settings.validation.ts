import { z } from 'zod';

// Very lenient schema - accepts any payload without strict validation
const updatePlatformSettingsSchema = z.object({}).passthrough();

export const settingsValidation = {
  updatePlatformSettingsSchema,
};
