import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { BkashService } from './bkash.service';
import { ServiceBookingModel } from '../serviceBooking/serviceBooking.model';
import { ServiceBookingStatus } from '../serviceBooking/serviceBooking.interface';
import { ClientProfileModel } from '../client/client.model';
import { ServiceModel } from '../service/service.model';
import AppError from '../../errorHelpers/AppError';

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SB-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Step 1: Client initiates payment → get bKash URL
const createPayment = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const { serviceId } = req.body;

  const service = await ServiceModel.findById(serviceId);
  if (!service) throw new AppError(StatusCodes.NOT_FOUND, 'Service not found');

  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client) throw new AppError(StatusCodes.NOT_FOUND, 'Client profile not found');

  // Generate unique orderId (used as tracking reference before booking is created)
  const orderId = `ORD-${Date.now()}-${client._id.toString().slice(-4)}`;

  const bkashRes = await BkashService.createPayment({
    amount: String(service.price || 0),
    orderId,
    merchantInvoiceNumber: orderId,
  }) as any;

  if (bkashRes.statusCode !== '0000') {
    throw new AppError(StatusCodes.BAD_REQUEST, bkashRes.statusMessage || 'bKash payment init failed');
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'bKash payment initiated',
    data: {
      bkashURL: bkashRes.bkashURL,
      paymentID: bkashRes.paymentID,
      orderId,
      serviceId,
    },
  });
});

// Step 2: bKash redirects back → execute payment & create booking
const executePayment = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const { paymentID, serviceId } = req.body;

  if (!paymentID) throw new AppError(StatusCodes.BAD_REQUEST, 'paymentID is required');

  const executeRes = await BkashService.executePayment(paymentID) as any;

  if (executeRes.transactionStatus !== 'Completed') {
    throw new AppError(StatusCodes.BAD_REQUEST, `Payment not completed: ${executeRes.statusMessage}`);
  }

  const service = await ServiceModel.findById(serviceId);
  if (!service) throw new AppError(StatusCodes.NOT_FOUND, 'Service not found');

  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client) throw new AppError(StatusCodes.NOT_FOUND, 'Client profile not found');

  let trackingCode = generateTrackingCode();
  while (await ServiceBookingModel.findOne({ trackingCode })) {
    trackingCode = generateTrackingCode();
  }

  const booking = await ServiceBookingModel.create({
    serviceId,
    clientId: client._id,
    trackingCode,
    amount: service.price,
    status: ServiceBookingStatus.PENDING,
    paymentStatus: 'paid',
    transactionId: executeRes.trxID,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Payment successful & service booked',
    data: {
      trackingCode: booking.trackingCode,
      trxID: executeRes.trxID,
      amount: executeRes.amount,
      serviceName: service.name,
    },
  });
});

// Query payment status
const queryPayment = catchAsync(async (req: Request, res: Response) => {
  const { paymentID } = req.params;
  const result = await BkashService.queryPayment(paymentID);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Payment status', data: result });
});

export const bkashController = {
  createPayment,
  executePayment,
  queryPayment,
};
