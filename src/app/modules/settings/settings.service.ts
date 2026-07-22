import { PlatformSettings } from './settings.model';
import { IPlatformSettings } from './settings.interface';

// Get platform settings (always returns one document)
const getPlatformSettings = async (): Promise<IPlatformSettings> => {
  let settings = await PlatformSettings.findOne();

  // If no settings exist, create default settings
  if (!settings) {
    settings = await PlatformSettings.create({});
  }

  // Ensure new fields exist on legacy documents (migration-safe)
  const needsUpdate: Record<string, unknown> = {};
  if (!settings.instantConsultancyNotice && settings.instantConsultancyNotice !== '') {
    needsUpdate['instantConsultancyNotice'] = '';
  }
  if (!settings.instantConsultancyDuration && settings.instantConsultancyDuration !== 0) {
    needsUpdate['instantConsultancyDuration'] = 10;
  }
  if (Object.keys(needsUpdate).length > 0) {
    console.log('Updating settings with missing fields:', needsUpdate);
    await PlatformSettings.findByIdAndUpdate(settings._id, { $set: needsUpdate });
    settings = await PlatformSettings.findById(settings._id) as typeof settings;
  }

  return settings;
};

// Update platform settings (admin only)
const updatePlatformSettings = async (
  payload: Partial<IPlatformSettings>
): Promise<IPlatformSettings> => {
  try {
    let settings = await PlatformSettings.findOne();

    if (!settings) {
      settings = await PlatformSettings.create(payload);
      return settings;
    }

    // Sanitize payload — remove undefined values so $set doesn't skip them
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) {
        sanitized[key] = value;
      }
    }
    // Always persist instantConsultancyNotice even if empty string
    if ('instantConsultancyNotice' in payload) {
      sanitized['instantConsultancyNotice'] = payload.instantConsultancyNotice ?? '';
    }
    // Always persist instantConsultancyDuration
    if ('instantConsultancyDuration' in payload) {
      sanitized['instantConsultancyDuration'] = payload.instantConsultancyDuration ?? 10;
    }

    const updatedSettings = await PlatformSettings.findByIdAndUpdate(
      settings._id,
      { $set: sanitized },
      { new: true, runValidators: false }
    );

    return updatedSettings || settings;
  } catch (error: any) {
    console.error('Settings update error:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

// Calculate platform fee based on amount
const calculatePlatformFee = async (amount: number): Promise<number> => {
  const settings = await getPlatformSettings();

  // If platform fee is disabled, return 0
  if (!settings.platformFee.enabled) {
    return 0;
  }

  // Calculate based on type
  if (settings.platformFee.type === 'PERCENTAGE') {
    return (amount * settings.platformFee.percentage) / 100;
  }

  // For FIXED type (future implementation)
  return settings.platformFee.percentage; // Use percentage field as fixed amount
};

// One-time migration: ensure all new fields exist in MongoDB document
const migrateSettings = async (): Promise<{ migrated: boolean; fields: string[] }> => {
  const settings = await PlatformSettings.findOne();
  if (!settings) {
    await PlatformSettings.create({});
    return { migrated: true, fields: ['created new document'] };
  }

  const updates: Record<string, unknown> = {};
  const fields: string[] = [];

  if (!settings.instantConsultancyNotice && settings.instantConsultancyNotice !== '') {
    updates['instantConsultancyNotice'] = '';
    fields.push('instantConsultancyNotice');
  }

  if (!settings.instantConsultancyDuration && settings.instantConsultancyDuration !== 0) {
    updates['instantConsultancyDuration'] = 10;
    fields.push('instantConsultancyDuration');
  }

  if (fields.length === 0) {
    return { migrated: false, fields: [] };
  }

  await PlatformSettings.findByIdAndUpdate(
    settings._id,
    { $set: updates },
    { runValidators: false }
  );

  return { migrated: true, fields };
};

export const settingsService = {
  getPlatformSettings,
  updatePlatformSettings,
  calculatePlatformFee,
  migrateSettings,
};
