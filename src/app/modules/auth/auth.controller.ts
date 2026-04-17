/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';

import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { authServices } from './auth.service';
import { setAuthCookie } from '../../utils/setCookie';
import { JwtPayload } from 'jsonwebtoken';
import { envVars } from '../../config/env';
import { createUserTokens } from '../../utils/createTokens';
import AppError from '../../errorHelpers/AppError';
import { UserModel } from '../user/user.model';
import { EIsActive } from '../user/user.interface';
import { LawyerProfileModel } from '../lawyer/lawyer.model';

const createLawyerAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const me = await authServices.createLawyerAccount(req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `${me.message}` || 'Lawyer Account Created Successfully!',
      data: me.data,
    });
  }
);

const createClientAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const me = await authServices.createClientAccount(req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Client Account Created Successfully!',
      data: me,
    });
  }
);

const verifyOTP = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await authServices.verifyOTP(req.body);
    setAuthCookie(res, user.tokens);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'OTP verified successfully!',
      data: user,
    });
  }
);

const userLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const me = await authServices.userLogin(req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Data received Successfully!',
      data: me,
    });
  }
);

const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    const loginInfo = await authServices.getNewAccessToken(refreshToken);

    setAuthCookie(res, loginInfo);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'AccessToken Created Successfully!',
      data: loginInfo,
    });
  }
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user as JwtPayload;

    const user = await UserModel.findById(decodedUser?.userId as string);
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    if (user.phoneNo) {
      user.phoneNo.isVerified = false;
      user.isActive = EIsActive.INACTIVE;
      user.isOnline = true;
      user.lastSeen = new Date()
      await user.save();
    }

    if (user.lawyer) {
      const lawyer = await LawyerProfileModel.findById(user.lawyer);
          if (lawyer) {
            lawyer.isOnline = false;
            await lawyer.save();
          }
    }

    // 🔹 কুকি ক্লিয়ার করা
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User logged out successfully!',
      data: null,
    });
  }
);

const googleCallbackController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let redirectTo = req.query.state ? (req.query.state as string) : '';

    if (redirectTo.startsWith('/')) {
      redirectTo = redirectTo.slice(1);
    }
    const user = req.user;

    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User Not Found');
    }

    const tokenInfo = createUserTokens(user);

    setAuthCookie(res, tokenInfo);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User log In successfully!',
      data: null,
    });
  }
);

const addPhoneNo = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const user = await authServices.addPhoneNo(
      decodedUser as JwtPayload,
      req.body
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Phone Number Added Successfully! and Send OTP',
      data: user,
    });
  }
);

const adminLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await authServices.adminLogin(req.body);
    setAuthCookie(res, data.tokens);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Admin logged in successfully!',
      data,
    });
  }
);

const saveFcmToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user as JwtPayload;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'FCM token is required');
    }

    await UserModel.findByIdAndUpdate(
      decodedUser?.userId,
      { $addToSet: { fcmTokens: fcmToken } },
      { new: true }
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'FCM token saved successfully!',
      data: null,
    });
  }
);

const googleMobileLogin = catchAsync(async (req: Request, res: Response) => {
  const data = await authServices.googleMobileLogin(req.body);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Google login successful', data });
});

const addPhoneForGoogleUser = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const data = await authServices.addPhoneForGoogleUser(decodedUser.userId, req.body.phone);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Phone added successfully', data });
});

const linkGoogle = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const { email, googleId, photo } = req.body;
  const user = await UserModel.findById(decodedUser.userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  const hasGoogle = user.auths?.some(a => a.provider === 'google');
  if (!hasGoogle) {
    await UserModel.findByIdAndUpdate(decodedUser.userId, {
      $push: { auths: { provider: 'google', providerId: googleId } },
      ...(email && !user.email ? { email } : {}),
      ...(photo && !user.profilePhoto ? { profilePhoto: photo } : {}),
    });
  }
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Google account linked', data: { email } });
});

const resendOTP = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await authServices.resendOTP(req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: data.message,
      data,
    });
  }
);

const firebasePhoneLogin = catchAsync(async (req: Request, res: Response) => {
  const data = await authServices.firebasePhoneLogin(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Firebase phone login successful',
    data,
  });
});

const updateAdminCredentials = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const data = await authServices.updateAdminCredentials(decodedUser.userId, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Admin credentials updated successfully',
    data,
  });
});

export const AuthController = {
  createLawyerAccount,
  createClientAccount,
  verifyOTP,
  resendOTP,
  userLogin,
  adminLogin,
  logout,
  getNewAccessToken,
  googleCallbackController,
  addPhoneNo,
  saveFcmToken,
  googleMobileLogin,
  addPhoneForGoogleUser,
  linkGoogle,
  firebasePhoneLogin,
  updateAdminCredentials,
};
