import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { serviceBookingService } from './serviceBooking.service';
import { ServiceBookingStatus } from './serviceBooking.interface';
import { multerUpload } from '../../config/multer.config';
import { uploadBufferToCloudinary } from '../../config/cloudinary.config';

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
  createApplication,
  trackApplication,
  getMyApplications,
  adminGetAllApplications,
  adminGetSingleApplication,
  adminUpdateStatus,
  getServiceStats,
};
