import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { paymentService } from './payment.service';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { SSLService } from './sslCommerz/sslCommerz.service';
import { envVars } from '../../config/env';

const reCreatePayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { paymentId } = req.params;
    const decodedUser = req.user;
    const payment = await paymentService.reCreatePayment(
      paymentId,
      decodedUser as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Payment link regenerated successfully',
      data: payment,
    });
  }
);



const successPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await paymentService.successPayment(
    query as Record<string, string>
  );

  if (result.success) {
    res.redirect(
      `${envVars.SSL.SSL_SUCCESS_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`
    );
  }
});
const failPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await paymentService.failPayment(
    query as Record<string, string>
  );


  if (!result.success) {
    res.redirect(
      `${envVars.SSL.SSL_FAIL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`
    );
  }
});
const cancelPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await paymentService.cancelPayment(
    query as Record<string, string>
  );
  if (!result.success) {
    res.redirect(
      `${envVars.SSL.SSL_CANCEL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`
    );
  }
});

const validatePayment = catchAsync(async (req: Request, res: Response) => {
  await SSLService.validatepayment(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment Validated Successfully',
    data: null,
  });
});


const getAllPayments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await paymentService.getAllPayments(
      req.query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Payments fetched successfully',
      data: result.data,
      meta: result.meta,
    });
  }
);

const getMyPayments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const result = await paymentService.getMyPayments(
      decodedUser as JwtPayload,
      req.query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Your payments fetched successfully',
      data: result.data,
      meta: result.meta,
    });
  }
);

const getSinglePayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const payment = await paymentService.getSinglePayment(id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Payment fetched successfully',
      data: payment,
    });
  }
);

const getPaymentByTransactionId = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { transactionId } = req.params;
    const payment = await paymentService.getPaymentByTransactionId(transactionId);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Payment fetched successfully',
      data: payment,
    });
  }
);

const updatePayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const payment = await paymentService.updatePayment(id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Payment updated successfully',
      data: payment,
    });
  }
);

const updatePaymentStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;
    const payment = await paymentService.updatePaymentStatus(id, status);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Payment status updated successfully',
      data: payment,
    });
  }
);

const deletePayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await paymentService.deletePayment(id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Payment deleted successfully',
      data: null,
    });
  }
);

const getPaymentStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await paymentService.getPaymentStats();

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Payment statistics fetched successfully',
      data: stats,
    });
  }
);

export const paymentController = {
  reCreatePayment,
  successPayment,
  failPayment,
  cancelPayment,
  validatePayment,
  getAllPayments,
  getMyPayments,
  getSinglePayment,
  getPaymentByTransactionId,
  updatePayment,
  updatePaymentStatus,
  deletePayment,
  getPaymentStats,
};
