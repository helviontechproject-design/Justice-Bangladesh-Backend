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
  if (settings.instantConsultancyNotice === undefined) {
    needsUpdate['instantConsultancyNotice'] = '';
  }
  if (Object.keys(needsUpdate).length > 0) {
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
      // Create if doesn't exist
      settings = await PlatformSettings.create(payload);
      return settings;
    }

    // Use findByIdAndUpdate with runValidators: false to bypass schema validation
    const updatedSettings = await PlatformSettings.findByIdAndUpdate(
      settings._id,
      { $set: payload },
      { 
        new: true,
        runValidators: false // Disable validation on update
      }
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

export const settingsService = {
  getPlatformSettings,
  updatePlatformSettings,
  calculatePlatformFee,
};
