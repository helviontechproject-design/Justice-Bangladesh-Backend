import { PlatformSettings } from './settings.model';
import { IPlatformSettings } from './settings.interface';

// Get platform settings (always returns one document)
const getPlatformSettings = async (): Promise<IPlatformSettings> => {
  let settings = await PlatformSettings.findOne();

  // If no settings exist, create default settings
  if (!settings) {
    settings = await PlatformSettings.create({
      instantConsultancyDuration: 10, // Add duration field on creation
    });
  }

  // Force update missing fields (aggressive migration)
  const updates: Record<string, unknown> = {};
  let needsUpdate = false;

  if (settings.instantConsultancyNotice === undefined || settings.instantConsultancyNotice === null) {
    updates['instantConsultancyNotice'] = '';
    needsUpdate = true;
  }
  
  if (settings.instantConsultancyDuration === undefined || settings.instantConsultancyDuration === null || typeof settings.instantConsultancyDuration !== 'number') {
    updates['instantConsultancyDuration'] = 10;
    needsUpdate = true;
  }

  if (needsUpdate) {
    console.log('🔧 Force updating settings with missing fields:', updates);
    await PlatformSettings.updateOne(
      { _id: settings._id }, 
      { 
        $set: updates,
        $unset: {} // Ensure no undefined fields
      },
      { upsert: false }
    );
    // Re-fetch to get updated document
    settings = await PlatformSettings.findById(settings._id) as typeof settings;
    console.log('✅ Updated settings:', settings.toObject());
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
    // Always persist both fields
    if ('instantConsultancyNotice' in payload) {
      sanitized['instantConsultancyNotice'] = payload.instantConsultancyNotice ?? '';
    }
    if ('instantConsultancyDuration' in payload) {
      const duration = payload.instantConsultancyDuration;
      sanitized['instantConsultancyDuration'] = (typeof duration === 'number' && duration >= 5 && duration <= 60) ? duration : 10;
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
  console.log('🔧 Starting migration process...');
  
  // Try to find existing settings
  let settings = await PlatformSettings.findOne();
  console.log('Current settings found:', !!settings);
  
  if (!settings) {
    console.log('🔧 Creating new settings document with all fields');
    settings = await PlatformSettings.create({
      instantConsultancyNotice: '',
      instantConsultancyDuration: 10,
    });
    return { migrated: true, fields: ['created new document with all fields'] };
  }

  // Force add the duration field using raw MongoDB update
  const result = await PlatformSettings.updateOne(
    { _id: settings._id },
    { 
      $set: { 
        instantConsultancyDuration: 10,
        instantConsultancyNotice: settings.instantConsultancyNotice || ''
      }
    }
  );
  
  console.log('🔧 Direct MongoDB update result:', result);
  
  // Verify the update worked
  const updated = await PlatformSettings.findById(settings._id);
  console.log('✅ After update - duration field:', updated?.instantConsultancyDuration);
  
  return { 
    migrated: true, 
    fields: ['forcefully added instantConsultancyDuration'],
    updateResult: result,
    hasField: !!updated?.instantConsultancyDuration
  };
};

export const settingsService = {
  getPlatformSettings,
  updatePlatformSettings,
  calculatePlatformFee,
  migrateSettings,
};
