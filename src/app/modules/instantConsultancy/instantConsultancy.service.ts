import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import AppError from '../../errorHelpers/AppError';
import { ClientProfileModel } from '../client/client.model';
import { LawyerProfileModel } from '../lawyer/lawyer.model';
import { InstantConsultancyModel } from './instantConsultancy.model';
import { InstantConsultancyStatus } from './instantConsultancy.interface';
import { envVars } from '../../config/env';
import { sendFCMToTokens } from '../../utils/fcm';

const pendingRequests = new Map<string, {
  channelName: string;
  callType: string;
  clientName: string;
  categoryId: string;
  appId: string;
  clientToken: string;
  createdAt: number;
}>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingRequests.entries()) {
    if (now - val.createdAt > 120000) pendingRequests.delete(key);
  }
}, 15000);

const buildToken = (channelName: string, uid: number): string => {
  const { AGORA_APP_ID, AGORA_APP_CERTIFICATE } = envVars;
  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) return '';
  const expireTime = Math.floor(Date.now() / 1000) + 3600;
  return RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID, AGORA_APP_CERTIFICATE,
    channelName, uid, RtcRole.PUBLISHER, expireTime, expireTime,
  );
};

const createRequest = async (decodedUser: JwtPayload, payload: {
  categoryId: string;
  callType: 'audio' | 'video';
  note?: string;
}) => {
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client) throw new AppError(StatusCodes.NOT_FOUND, 'Client profile not found');

  const clientName = `${client.profileInfo?.fast_name || ''} ${client.profileInfo?.last_name || ''}`.trim() || 'Client';

  const onlineLawyers = await LawyerProfileModel.find({
    isOnline: true,
    categories: new Types.ObjectId(payload.categoryId),
  }).populate('userId', '_id fcmTokens');

  if (onlineLawyers.length === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No available lawyers for this category right now. Please try again later.');
  }

  const channelName = `ic_${Date.now()}`;
  const clientToken = buildToken(channelName, 1);
  const appId = envVars.AGORA_APP_ID || '';

  const request = await InstantConsultancyModel.create({
    clientId: (client._id as any),
    categoryId: payload.categoryId,
    callType: payload.callType || 'audio',
    note: payload.note,
    channelName,
    status: InstantConsultancyStatus.WAITING,
  });

  const requestId = (request._id as any).toString();

  pendingRequests.set(requestId, {
    channelName,
    callType: payload.callType || 'audio',
    clientName,
    categoryId: payload.categoryId,
    appId,
    clientToken,
    createdAt: Date.now(),
  });

  // Send FCM to all online lawyers of this category
  for (const lawyer of onlineLawyers) {
    const lawyerUser = lawyer.userId as any;
    const tokens: string[] = lawyerUser?.fcmTokens || (lawyerUser?.fcmToken ? [lawyerUser.fcmToken] : []);
    if (tokens.length > 0) {
      try {
        await sendFCMToTokens(
          tokens,
          '📞 Instant Consultation Request',
          `${clientName} needs ${payload.callType || 'audio'} consultation. Be the first to accept!`,
        );
      } catch (_) {}
    }
  }

  return {
    requestId,
    channelName,
    clientToken,
    appId,
    status: InstantConsultancyStatus.WAITING,
  };
};

const acceptRequest = async (decodedUser: JwtPayload, requestId: string) => {
  const lawyer = await LawyerProfileModel.findOne({ userId: decodedUser.userId });
  if (!lawyer) throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer profile not found');

  const updated = await InstantConsultancyModel.findOneAndUpdate(
    { _id: requestId, status: InstantConsultancyStatus.WAITING },
    { lawyerId: (lawyer._id as any), status: InstantConsultancyStatus.ACCEPTED },
    { new: true }
  );

  if (!updated) {
    throw new AppError(StatusCodes.CONFLICT, 'Request already accepted by another lawyer');
  }

  const pending = pendingRequests.get(requestId);
  const channelName = updated.channelName || requestId;
  const lawyerToken = buildToken(channelName, 2);
  const appId = envVars.AGORA_APP_ID || '';

  return {
    requestId,
    channelName,
    lawyerToken,
    appId,
    callType: updated.callType,
    clientName: pending?.clientName || 'Client',
  };
};

const getPendingForLawyer = async (decodedUser: JwtPayload) => {
  const lawyer = await LawyerProfileModel.findOne({ userId: decodedUser.userId })
    .populate('categories', '_id name');
  if (!lawyer) return null;

  const categoryIds = (lawyer.categories as any[]).map((c: any) => c._id || c);

  const request = await InstantConsultancyModel.findOne({
    status: InstantConsultancyStatus.WAITING,
    categoryId: { $in: categoryIds },
  })
    .populate('clientId', 'profileInfo')
    .populate('categoryId', 'name')
    .sort({ createdAt: 1 });

  if (!request) return null;

  const pending = pendingRequests.get((request._id as any).toString());

  return {
    requestId: (request._id as any).toString(),
    channelName: request.channelName,
    callType: request.callType,
    clientName: pending?.clientName || 'Client',
    categoryName: (request.categoryId as any)?.name || '',
    appId: envVars.AGORA_APP_ID || '',
  };
};

const getRequestStatus = async (requestId: string) => {
  const request = await InstantConsultancyModel.findById(requestId)
    .populate('lawyerId', 'profile_Details avarage_rating')
    .populate('categoryId', 'name');
  if (!request) throw new AppError(StatusCodes.NOT_FOUND, 'Request not found');

  let lawyerToken: string | null = null;
  if (request.status === InstantConsultancyStatus.ACCEPTED && request.channelName) {
    lawyerToken = buildToken(request.channelName, 2);
  }

  return {
    requestId: (request._id as any).toString(),
    status: request.status,
    channelName: request.channelName,
    callType: request.callType,
    appId: envVars.AGORA_APP_ID || '',
    lawyerToken,
    lawyer: request.lawyerId,
  };
};

const cancelRequest = async (decodedUser: JwtPayload, requestId: string) => {
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client) throw new AppError(StatusCodes.NOT_FOUND, 'Client not found');

  const request = await InstantConsultancyModel.findOneAndUpdate(
    { _id: requestId, clientId: (client._id as any), status: InstantConsultancyStatus.WAITING },
    { status: InstantConsultancyStatus.CANCELLED },
    { new: true }
  );
  if (!request) throw new AppError(StatusCodes.NOT_FOUND, 'Request not found or already accepted');
  pendingRequests.delete(requestId);
  return request;
};

const adminGetAll = async () => {
  return InstantConsultancyModel.find()
    .populate('clientId', 'profileInfo')
    .populate('lawyerId', 'profile_Details')
    .populate('categoryId', 'name')
    .sort({ createdAt: -1 });
};

export const instantConsultancyService = {
  createRequest,
  acceptRequest,
  getPendingForLawyer,
  getRequestStatus,
  cancelRequest,
  adminGetAll,
};
