import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../errorHelpers/AppError';
import { ServiceModel } from '../service/service.model';
import { ClientProfileModel } from '../client/client.model';
import { ServiceBookingModel } from './serviceBooking.model';
import { ServiceBookingStatus } from './serviceBooking.interface';

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'APP-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const createApplication = async (
  decodedUser: JwtPayload,
  serviceId: string,
  transactionId: string,
  applicantName: string,
  applicantPhone: string,
  documents: { label: string; url: string; originalName: string }[]
) => {
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
    transactionId,
    applicantName,
    applicantPhone,
    documents,
  });

  return booking;
};

const trackApplication = async (trackingCode: string) => {
  const booking = await ServiceBookingModel.findOne({ trackingCode })
    .populate('serviceId', 'name imageUrl price');
  if (!booking) throw new AppError(StatusCodes.NOT_FOUND, 'Application not found');
  return booking;
};

const getMyApplications = async (decodedUser: JwtPayload) => {
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client) throw new AppError(StatusCodes.NOT_FOUND, 'Client profile not found');
  return ServiceBookingModel.find({ clientId: client._id })
    .populate('serviceId', 'name imageUrl price')
    .sort({ createdAt: -1 });
};

const adminGetAllApplications = async () => {
  return ServiceBookingModel.find()
    .populate('serviceId', 'name price')
    .populate('clientId', 'profileInfo')
    .sort({ createdAt: -1 });
};

const adminGetSingleApplication = async (id: string) => {
  const app = await ServiceBookingModel.findById(id)
    .populate('serviceId', 'name price imageUrl')
    .populate('clientId', 'profileInfo');
  if (!app) throw new AppError(StatusCodes.NOT_FOUND, 'Application not found');
  return app;
};

const adminUpdateStatus = async (id: string, status: ServiceBookingStatus, rejectReason?: string) => {
  const booking = await ServiceBookingModel.findById(id);
  if (!booking) throw new AppError(StatusCodes.NOT_FOUND, 'Application not found');
  booking.status = status;
  if (status === ServiceBookingStatus.REJECTED && rejectReason) {
    booking.rejectReason = rejectReason;
  }
  await booking.save();
  return booking;
};

const getServiceStats = async (serviceId: string) => {
  const total = await ServiceBookingModel.countDocuments({ serviceId });
  const avgRating = 0; // from reviews
  return { total, avgRating };
};

export const serviceBookingService = {
  createApplication,
  trackApplication,
  getMyApplications,
  adminGetAllApplications,
  adminGetSingleApplication,
  adminUpdateStatus,
  getServiceStats,
};
