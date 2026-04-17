import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { statsService } from './stats.service';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../errorHelpers/AppError';
import { IStatsQuery } from './stats.interface';
import { LawyerProfileModel } from '../lawyer/lawyer.model';
import { ClientProfileModel } from '../client/client.model';


const getAdminStats = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as IStatsQuery;
  const stats = await statsService.getAdminDashboardStats(query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Admin statistics retrieved successfully',
    data: stats,
  });
});


const getLawyerStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  if (!user.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized user');
  }

  const lawyer= await LawyerProfileModel.findOne({ userId: user.userId });
  const lawyerId = lawyer?._id;

  if (!lawyerId) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Lawyer profile not found for this user'
    );
  }

  const query = req.query as unknown as IStatsQuery;
  const stats = await statsService.getLawyerDashboardStats(
    lawyerId.toString(),
    query
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Lawyer statistics retrieved successfully',
    data: stats,
  });
});


const getClientStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  if (!user.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized user');
  }

  const Client = await ClientProfileModel.findOne({ userId: user.userId });

  if (!Client) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Client profile not found for this user'
    );
  }
 
  const clientId = Client._id

  if (!clientId) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Client profile not found for this user'
    );
  }

  const query = req.query as unknown as IStatsQuery;
  const stats = await statsService.getClientDashboardStats(
    clientId.toString(),
    query
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Client statistics retrieved successfully',
    data: stats,
  });
});

export const statsController = {
  getAdminStats,
  getLawyerStats,
  getClientStats,
};
