import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { broadcastService } from './broadcast.service';
import { multerUpload } from '../../config/multer.config';
import AppError from '../../errorHelpers/AppError';

const create = catchAsync(async (req: Request, res: Response) => {
  try {
    const payload = { ...req.body };
    if (req.file?.path) payload.imageUrl = req.file.path;
    
    if (!payload.title) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Title is required');
    }
    
    const result = await broadcastService.createBroadcast(payload);
    sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: 'Broadcast created', data: result });
  } catch (error: any) {
    throw new AppError(StatusCodes.BAD_REQUEST, error.message || 'Failed to create broadcast');
  }
});

const send = catchAsync(async (req: Request, res: Response) => {
  try {
    const result = await broadcastService.sendBroadcast(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Broadcast sent to all users', data: result });
  } catch (error: any) {
    throw new AppError(StatusCodes.BAD_REQUEST, error.message || 'Failed to send broadcast');
  }
});

const getAll = catchAsync(async (_req: Request, res: Response) => {
  try {
    const result = await broadcastService.getAllBroadcasts();
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Broadcasts fetched', data: result });
  } catch (error: any) {
    throw new AppError(StatusCodes.BAD_REQUEST, error.message || 'Failed to fetch broadcasts');
  }
});

const update = catchAsync(async (req: Request, res: Response) => {
  try {
    const payload = { ...req.body };
    if (req.file?.path) payload.imageUrl = req.file.path;
    
    if (!payload.title) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Title is required');
    }
    
    const result = await broadcastService.updateBroadcast(req.params.id, payload);
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Broadcast updated', data: result });
  } catch (error: any) {
    throw new AppError(StatusCodes.BAD_REQUEST, error.message || 'Failed to update broadcast');
  }
});

const remove = catchAsync(async (req: Request, res: Response) => {
  try {
    await broadcastService.deleteBroadcast(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Broadcast deleted', data: null });
  } catch (error: any) {
    throw new AppError(StatusCodes.BAD_REQUEST, error.message || 'Failed to delete broadcast');
  }
});

export const broadcastController = { create, send, getAll, update, remove };
