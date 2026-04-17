import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { instantConsultancyService } from './instantConsultancy.service';

const createRequest = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const result = await instantConsultancyService.createRequest(decodedUser, req.body);
  sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: 'Request created. Notifying available lawyers...', data: result });
});

const acceptRequest = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const result = await instantConsultancyService.acceptRequest(decodedUser, req.params.requestId);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Request accepted. Starting call...', data: result });
});

const getPendingForLawyer = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const result = await instantConsultancyService.getPendingForLawyer(decodedUser);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Pending request', data: result });
});

const getRequestStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await instantConsultancyService.getRequestStatus(req.params.requestId);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Request status', data: result });
});

const cancelRequest = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const result = await instantConsultancyService.cancelRequest(decodedUser, req.params.requestId);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Request cancelled', data: result });
});

const adminGetAll = catchAsync(async (_req: Request, res: Response) => {
  const result = await instantConsultancyService.adminGetAll();
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'All requests', data: result });
});

export const instantConsultancyController = {
  createRequest,
  acceptRequest,
  getPendingForLawyer,
  getRequestStatus,
  cancelRequest,
  adminGetAll,
};
