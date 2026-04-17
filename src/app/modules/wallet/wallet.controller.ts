import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { walletService } from './wallet.service';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';



const getAllWallets = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await walletService.getAllWallets(
      req.query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Wallets fetched successfully',
      data: result.data,
      meta: result.meta,
    });
  }
);

const getMyWallet = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const wallet = await walletService.getMyWallet(decodedUser as JwtPayload);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Your wallet fetched successfully',
      data: wallet,
    });
  }
);

const getWalletById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const wallet = await walletService.getWalletById(id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Wallet fetched successfully',
      data: wallet,
    });
  }
);

const getWalletByLawyerId = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { lawyerId } = req.params;
    const wallet = await walletService.getWalletByLawyerId(lawyerId);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Wallet fetched successfully',
      data: wallet,
    });
  }
);

const updateWallet = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const wallet = await walletService.updateWallet(id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Wallet updated successfully',
      data: wallet,
    });
  }
);




export const walletController = {
  getAllWallets,
  getMyWallet,
  getWalletById,
  getWalletByLawyerId,
  updateWallet,
};
