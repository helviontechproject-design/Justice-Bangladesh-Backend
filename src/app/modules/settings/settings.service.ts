import { PlatformSettings } from './settings.model';
import { IPlatformSettings } from './settings.interface';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';

// Get platform settings (always returns one document)
const getPlatformSettings = async (): Promise<IPlatformSettings> => {
  let settings = await PlatformSettings.findOne();

  // If no settings exist, create default settings
  if (!settings) {
    settings = await PlatformSettings.create({});
  }

  return settings;
};

// Update platform settings (admin only)
const updatePlatformSettings = async (
  payload: Partial<IPlatformSettings>
): Promise<IPlatformSettings> => {
  let settings = await PlatformSettings.findOne();

  if (!settings) {
    // Create if doesn't exist
    settings = await PlatformSettings.create(payload);
  } else {
    // Update existing settings using deep merge for nested objects
    if (payload.platformFee) {
      settings.platformFee = { ...settings.platformFee, ...payload.platformFee };
    }
    if (payload.payout) {
      settings.payout = { ...settings.payout, ...payload.payout };
    }
    if (payload.payment) {
      settings.payment = { ...settings.payment, ...payload.payment };
    }
    if (payload.general) {
      settings.general = { ...settings.general, ...payload.general };
    }
    if (payload.socialLinks) {
      settings.socialLinks = { ...settings.socialLinks, ...payload.socialLinks };
    }
    if (payload.contacts) {
      settings.contacts = { ...settings.contacts, ...payload.contacts };
    }
    if (payload.seo) {
      settings.seo = { ...settings.seo, ...payload.seo };
    }
    if (payload.whatsapp) {
      settings.whatsapp = { ...settings.whatsapp, ...payload.whatsapp } as { clientNumber: string; lawyerNumber: string };
    }
    if (payload.homePageCards) {
      settings.homePageCards = {
        instantConsultationCard: {
          image: payload.homePageCards.instantConsultationCard?.image ?? settings.homePageCards?.instantConsultationCard?.image ?? '',
        },
        popularSpecialistCard: {
          image: payload.homePageCards.popularSpecialistCard?.image ?? settings.homePageCards?.popularSpecialistCard?.image ?? '',
        },
      };
    }

    await settings.save();
  }

  return settings;
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




