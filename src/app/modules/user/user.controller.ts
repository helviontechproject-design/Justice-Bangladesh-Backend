/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';

import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { userServices } from './user.service';
import { UserModel } from './user.model';

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;

    const me = await userServices.getMe(decodedUser as JwtPayload);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Data received Successfully!',
      data: me,
    });
  }
);

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;

    const allUsers = await userServices.getAllUsers(
      decodedUser as JwtPayload,
      req.query as Record<string, string>
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Data received Successfully!',
      data: allUsers,
    });
  }
);

const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const payload = {
      ...req.body,
    };

    if (req.file) {
      payload.profilePhoto = req.file.path;
    }

    const user = await userServices.updateUser(
      decodedUser as JwtPayload,
      payload
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Data received Successfully!',
      data: user,
    });
  }
);





const updateFcmToken = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const { fcmToken } = req.body;
  await UserModel.findByIdAndUpdate(userId, { fcmToken });
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'FCM token updated', data: null });
});

export const userController = {
  getMe,
  getAllUsers,
  updateUser,
  updateFcmToken,
};
