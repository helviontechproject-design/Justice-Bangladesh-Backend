import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { serviceBookingService } from './serviceBooking.service';
import { ServiceBookingStatus } from './serviceBooking.interface';
import { multerUpload } from '../../config/multer.config';
import { uploadBufferToCloudinary } from '../../config/cloudinary.config';
import { PayStationService } from '../payment/paystation/paystation.service';
import { ServiceModel } from '../service/service.model';

// Initiate payment for service booking
const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const { serviceId } = req.body;

  const service = await ServiceModel.findById(serviceId);
  if (!service) {
    return sendResponse(res, { success: false, statusCode: StatusCodes.NOT_FOUND, message: 'Service not found', data: null });
  }

  // Get user details for PayStation
  const userModel = require('../user/user.model').UserModel;
  const userDetails = await userModel.findById(decodedUser.userId).select('+phoneNo');
  
  if (!userDetails?.phoneNo?.value) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Phone number is required to process payment',
      data: null,
    });
  }

  // Email can be empty string, use placeholder if not available
  const customerEmail = userDetails?.email || `client${Date.now()}@justice.com`;
  const customerName = userDetails?.email?.split('@')[0] || `Client${Date.now()}`;

  if (!service.price || service.price === 0) {
    return sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Free service - no payment required',
      data: {
        orderId: `SVC-${Date.now()}`,
        paymentUrl: null,
        isFree: true,
      },
    });
  }

  // Create PayStation payment
  const orderId = `SVC-${Date.now()}`;
  const paystationPayload = {
    currency: 'BDT',
    cust_name: customerName,
    cust_phone: userDetails.phoneNo.value,
    cust_email: customerEmail,
    amount: service.price,
    payment_amount: service.price,
    invoice_number: orderId,
    reference: `Service Booking: ${service.name}`,
    return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/service-payment-callback`,
    callback_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/service-booking/payment-callback`,
  };

  console.log('💳 Initiating PayStation payment for Service:', orderId);
  console.log('PayStation payload:', paystationPayload);

  const paystationPayment = await PayStationService.initiatePayment(paystationPayload);

  if (!paystationPayment?.payment_url) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_GATEWAY,
      message: 'Failed to initiate payment with PayStation',
      data: null,
    });
  }

  console.log('✅ PayStation payment initiated:', orderId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Payment initiated',
    data: {
      orderId,
      paymentUrl: paystationPayment.payment_url,
      amount: service.price,
    },
  });
});

const createApplication = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const { serviceId, transactionId, applicantName, applicantPhone, documents } = req.body;

  // documents from body (already uploaded URLs) or from files
  let docList: { label: string; url: string; originalName: string }[] = [];

  if (req.files && Array.isArray(req.files)) {
    const labels: string[] = JSON.parse(req.body.documentLabels || '[]');
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i] as Express.Multer.File;
      const result = await uploadBufferToCloudinary(file.buffer, 'service-docs') as any;
      docList.push({
        label: labels[i] || `Document ${i + 1}`,
        url: result.secure_url,
        originalName: file.originalname,
      });
    }
  } else if (documents) {
    docList = typeof documents === 'string' ? JSON.parse(documents) : documents;
  }

  const result = await serviceBookingService.createApplication(
    decodedUser, serviceId, transactionId, applicantName, applicantPhone, docList
  );
  sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: 'Application submitted successfully', data: result });
});

const trackApplication = catchAsync(async (req: Request, res: Response) => {
  const result = await serviceBookingService.trackApplication(req.params.trackingCode);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Application found', data: result });
});

const getMyApplications = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const result = await serviceBookingService.getMyApplications(decodedUser);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'My applications', data: result });
});

const adminGetAllApplications = catchAsync(async (_req: Request, res: Response) => {
  const result = await serviceBookingService.adminGetAllApplications();
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'All applications', data: result });
});

const adminGetSingleApplication = catchAsync(async (req: Request, res: Response) => {
  const result = await serviceBookingService.adminGetSingleApplication(req.params.id);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Application details', data: result });
});

const adminUpdateStatus = catchAsync(async (req: Request, res: Response) => {
  const { status, rejectReason } = req.body;
  const result = await serviceBookingService.adminUpdateStatus(req.params.id, status as ServiceBookingStatus, rejectReason);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Status updated', data: result });
});

const getServiceStats = catchAsync(async (req: Request, res: Response) => {
  const result = await serviceBookingService.getServiceStats(req.params.serviceId);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Service stats', data: result });
});

export const serviceBookingController = {
  initiatePayment,
  createApplication,
  trackApplication,
  getMyApplications,
  adminGetAllApplications,
  adminGetSingleApplication,
  adminUpdateStatus,
  getServiceStats,
};
