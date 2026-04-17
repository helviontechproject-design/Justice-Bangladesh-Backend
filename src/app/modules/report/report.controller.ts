import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { reportService } from './report.service';

const create = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const userRole = (req as any).user.role;
  const data = await reportService.create({ ...req.body, userId, userRole });
  sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: 'Report submitted', data });
});

const getMyReports = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId.toString();
  const data = await reportService.getMyReports(userId);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Reports fetched', data });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const data = await reportService.getAll(status);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Reports fetched', data });
});

const reply = catchAsync(async (req: Request, res: Response) => {
  const { adminReply } = req.body;
  const data = await reportService.reply(req.params.id, adminReply);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Reply sent', data });
});

export const reportController = { create, getMyReports, getAll, reply };
