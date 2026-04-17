import { envVars } from '../config/env';
import AppError from '../errorHelpers/AppError';
import { verifyToken } from '../utils/jwt';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { UserModel } from '../modules/user/user.model';
import { EIsActive } from '../modules/user/user.interface';

export const checkAuth = (...authRole: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      let accessToken =
        req.cookies?.accessToken || req.headers?.authorization
      
      // Extract token from "Bearer <token>" format
      if (accessToken && accessToken.startsWith('Bearer ')) {
        accessToken = accessToken.slice(7); // Remove "Bearer " prefix
      }
      
      if (req?.body?.token) {
        accessToken = req.body.token;
      }
      if (!accessToken) {
        throw new AppError(StatusCodes.FORBIDDEN, 'No Token Received');
      }
      const decodedToken = verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;

      const isUserExist = await UserModel.findById(decodedToken.userId);

      if (!isUserExist) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User does not exist');
      }
      if (
        isUserExist.isActive === EIsActive.BLOCKED ||
        isUserExist.isActive === EIsActive.INACTIVE
      ) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `User is ${isUserExist.isActive}`
        );
      }
      if (isUserExist.isDeleted) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User is deleted');
      }
      if (!authRole.includes(isUserExist.role)) {
        throw new AppError(403, 'You are not permitted to view this route!!!');
      }

      req.user = decodedToken;
      next();
    } catch (error) {
      next(error);
    }
  };
