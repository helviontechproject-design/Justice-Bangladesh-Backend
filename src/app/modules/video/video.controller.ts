import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { videoService } from './video.service';

const createVideo = catchAsync(async (req: Request, res: Response) => {
  const data = await videoService.createVideo(req.body);
  sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: 'Video created', data });
});

const getAllVideos = catchAsync(async (req: Request, res: Response) => {
  const data = await videoService.getAllVideos();
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Videos fetched', data });
});

const getAllVideosAdmin = catchAsync(async (req: Request, res: Response) => {
  const data = await videoService.getAllVideosAdmin();
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Videos fetched', data });
});

const updateVideo = catchAsync(async (req: Request, res: Response) => {
  const data = await videoService.updateVideo(req.params.id, req.body);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Video updated', data });
});

const deleteVideo = catchAsync(async (req: Request, res: Response) => {
  const data = await videoService.deleteVideo(req.params.id);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Video deleted', data });
});

export const videoController = { createVideo, getAllVideos, getAllVideosAdmin, updateVideo, deleteVideo };
