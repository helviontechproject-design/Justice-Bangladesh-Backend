import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { settingsService } from './settings.service';
import AppError from '../../errorHelpers/AppError';

// Get platform settings (public)
const getPlatformSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await settingsService.getPlatformSettings();

  // Force ensure duration field exists in API response (fallback approach)
  const responseData = {
    ...result,
    instantConsultancyDuration: Number(result.instantConsultancyDuration) || 10,
    instantConsultancyNotice: String(result.instantConsultancyNotice || ''),
  };

  console.log('🔧 Final response data:', JSON.stringify(responseData, null, 2));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Platform settings retrieved successfully',
    data: responseData,
  });
});

// Update platform settings (admin only)
const updatePlatformSettings = catchAsync(async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Request body cannot be empty');
  }

  // Remove MongoDB metadata fields if present
  const { _id, __v, createdAt, updatedAt, ...updatePayload } = req.body;

  const result = await settingsService.updatePlatformSettings(updatePayload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Platform settings updated successfully',
    data: result,
  });
});

// One-time migration: add missing fields to existing MongoDB document
const migrateSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await settingsService.migrateSettings();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Migration completed',
    data: result,
  });
});

export const settingsController = {
  getPlatformSettings,
  updatePlatformSettings,
  migrateSettings,
};


