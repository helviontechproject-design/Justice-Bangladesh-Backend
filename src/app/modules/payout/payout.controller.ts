import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes as httpStatus } from "http-status-codes";
import { payoutServices } from "./payout.service";
import { Payout } from "./payout.model";
import { WalletModel } from "../wallet/wallet.model";
import { PayoutStatus } from "./payout.interface";
import AppError from "../../errorHelpers/AppError";

const requestPayout = catchAsync(async (req: Request, res: Response) => {
  const lawyerUserId = (req.user as any).userId;

  const result = await payoutServices.requestPayout(lawyerUserId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Payout requested successfully",
    data: result,
  });
});

const processPayout = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const providerPayoutId = req.body?.providerPayoutId;
  const result = await payoutServices.processPayout(id, providerPayoutId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payout processed successfully",
    data: result,
  });
});

const failPayout = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { failureReason } = req.body;
  const result = await payoutServices.failPayout(id, failureReason);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payout marked as failed",
    data: result,
  });
});

const cancelPayout = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const lawyerUserId = (req.user as any).userId;
  const { reason } = req.body;
  const result = await payoutServices.cancelPayout(id, lawyerUserId, reason);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payout cancelled successfully",
    data: result,
  });
});

const getAllPayouts = catchAsync(async (req: Request, res: Response) => {
  const result = await payoutServices.getAllPayouts(
    req.query as Record<string, string>,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All payouts retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getMyPayouts = catchAsync(async (req: Request, res: Response) => {
  const lawyerUserId = (req.user as any).userId;
  const result = await payoutServices.getMyPayouts(lawyerUserId);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'My payouts retrieved', data: result });
});

const adminCancelPayout = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body ?? {};
  const payout = await Payout.findById(id);
  if (!payout) throw new AppError(httpStatus.NOT_FOUND, 'Payout not found');
  if (!['PENDING', 'PROCESSING'].includes(payout.status)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Only pending or processing payouts can be cancelled');
  }
  const wallet = await WalletModel.findOne({ lawyerId: payout.lawyerId });
  payout.status = PayoutStatus.CANCELLED;
  if (reason) payout.failureReason = reason;
  await payout.save();
  if (wallet) {
    wallet.balance += payout.amount;
    wallet.payableBalance += payout.amount;
    wallet.pendingBalance = Math.max(0, wallet.pendingBalance - payout.amount);
    wallet.totalPlatformFee = Math.max(0, wallet.totalPlatformFee - payout.platformFee);
    await wallet.save();
  }
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Payout cancelled by admin', data: payout });
});

export const payoutController = {
  requestPayout,
  getAllPayouts,
  processPayout,
  failPayout,
  cancelPayout,
  getMyPayouts,
  adminCancelPayout,
};
