import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { settingsService } from './settings.service';
import AppError from '../../errorHelpers/AppError';

// Get platform settings (public)
const getPlatformSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await settingsService.getPlatformSettings();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Platform settings retrieved successfully',
    data: result,
  });
});

// Update platform settings (admin only)
const updatePlatformSettings = catchAsync(async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Request body cannot be empty');
  }

  const result = await settingsService.updatePlatformSettings(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Platform settings updated successfully',
    data: result,
  });
});

export const settingsController = {
  getPlatformSettings,
  updatePlatformSettings,
};

