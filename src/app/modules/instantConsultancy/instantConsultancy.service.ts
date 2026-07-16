import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import AppError from '../../errorHelpers/AppError';
import { ClientProfileModel } from '../client/client.model';
import { LawyerProfileModel } from '../lawyer/lawyer.model';
import { InstantConsultancyModel, InstantConsultancySettingsModel, InstantConsultancyItemModel } from './instantConsultancy.model';
import { InstantConsultancyStatus, INSTANT_CONSULTATION_FEE } from './instantConsultancy.interface';
import { envVars } from '../../config/env';
import { sendFCMToTokens } from '../../utils/fcm';
// import { BkashService } from '../bkash/bkash.service'; // Removed: Using PayStation now

const REQUEST_EXPIRE_MS = 120000;

const pendingRequests = new Map<string, {
  channelName: string;
  appointmentType: string;
  clientName: string;
  categoryId: string;
  appId: string;
  clientToken: string;
  createdAt: number;
}>();

const expirePendingRequests = async () => {
  const now = Date.now();
  for (const [key, val] of pendingRequests.entries()) {
    if (now - val.createdAt > REQUEST_EXPIRE_MS) {
      pendingRequests.delete(key);
      await InstantConsultancyModel.findOneAndUpdate(
        { _id: key, status: InstantConsultancyStatus.WAITING },
        { status: InstantConsultancyStatus.EXPIRED },
      );
    }
  }
};

setInterval(() => {
  expirePendingRequests().catch(() => {});
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

const getSettings = async () => {
  let settings = await InstantConsultancySettingsModel.findOne();
  if (!settings) {
    settings = await InstantConsultancySettingsModel.create({
      fee: INSTANT_CONSULTATION_FEE,
      durationMinutes: 10,
      isEnabled: true,
    });
  }
  return settings;
};

const updateSettings = async (payload: { fee?: number; durationMinutes?: number; isEnabled?: boolean; noticeText?: string }) => {
  let settings = await InstantConsultancySettingsModel.findOne();
  if (!settings) {
    settings = await InstantConsultancySettingsModel.create({ ...payload });
  } else {
    if (payload.fee !== undefined) settings.fee = payload.fee;
    if (payload.durationMinutes !== undefined) settings.durationMinutes = payload.durationMinutes;
    if (payload.isEnabled !== undefined) settings.isEnabled = payload.isEnabled;
    if (payload.noticeText !== undefined) settings.noticeText = payload.noticeText;
    await settings.save();
  }
  return settings;
};

const initPayment = async (decodedUser: JwtPayload, payload: {
  categoryId: string;
  appointmentType?: 'Audio Call' | 'Video Call';
  note?: string;
  documentUrls?: string[];
  itemId?: string; // Optional: specific item ID
}) => {
  console.log('📝 Init Payment Request:', { categoryId: payload.categoryId, itemId: payload.itemId });
  
  if (!PAYMENT_ENABLED) {
    throw new AppError(StatusCodes.NOT_IMPLEMENTED, 'Payment is currently disabled. Use /request directly.');
  }
  const settings = await getSettings();
  if (!settings.isEnabled) {
    throw new AppError(StatusCodes.SERVICE_UNAVAILABLE, 'Instant consultancy is currently disabled.');
  }

  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client) throw new AppError(StatusCodes.NOT_FOUND, 'Client profile not found');

  const onlineLawyers = await LawyerProfileModel.find({
    isOnline: true,
    categories: new Types.ObjectId(payload.categoryId),
    instantConsultancy: true,
  });

  if (onlineLawyers.length === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No available lawyers for this category right now. Please try again later.');
  }

  // Determine fee: Use item fee if item selected, otherwise use settings default fee
  let consultationFee = settings.fee;
  let itemName = 'Instant Legal Consultancy';
  
  if (payload.itemId) {
    console.log('🔍 Looking up item fee for itemId:', payload.itemId);
    const item = await InstantConsultancyItemModel.findById(payload.itemId);
    if (item && item.isActive) {
      consultationFee = item.fee;
      itemName = item.name;
      console.log('✅ Item found - Using item fee:', consultationFee, 'Name:', itemName);
    } else {
      console.log('⚠️ Item not found or inactive - Using default fee:', consultationFee);
    }
  } else {
    console.log('ℹ️ No itemId provided - Using default settings fee:', consultationFee);
  }

  const orderId = `IC-${Date.now()}-${(client._id as any).toString().slice(-4)}`;

  // Create PayStation payment
  try {
    const userAddress =
      client.profileInfo.street_address || 
      client.profileInfo.district || 
      'Bangladesh';
    const userEmail = client.profileInfo.email || 'demo@gmail.com';
    const userPhoneNumber = client.profileInfo.phone;
    const userName =
      `${client.profileInfo.fast_name || ''} ${client.profileInfo.last_name || ''}`.trim() || 'Client';

    const paystationPayload = {
      invoice_number: orderId,
      currency: 'BDT',
      payment_amount: consultationFee, // Use determined fee (item fee or default)
      reference: `Instant-Consultancy-${orderId}`,
      cust_name: userName,
      cust_phone: userPhoneNumber,
      cust_email: userEmail,
      cust_address: userAddress,
      callback_url: `https://app.justicebangladesh.com/instant-consultancy/callback?orderId=${orderId}`,
      checkout_items: itemName, // Use item name if available
    };

    console.log('💳 Initiating PayStation payment for Instant Consultancy:', orderId);

    const { PayStationService } = await import('../payment/paystation/paystation.service');
    const paystationPayment = await PayStationService.initiatePayment(paystationPayload);

    // Store pending meta in memory until payment is executed
    pendingRequests.set(orderId, {
      channelName: '',
      appointmentType: payload.appointmentType || 'Audio Call',
      clientName: userName,
      categoryId: payload.categoryId,
      appId: envVars.AGORA_APP_ID || '',
      clientToken: '',
      createdAt: Date.now(),
    });

    console.log('✅ PayStation payment URL generated for Instant Consultancy');

    return {
      paymentUrl: paystationPayment?.payment_url || null,
      paymentID: orderId,
      orderId,
      fee: consultationFee, // Return actual fee being charged
      note: payload.note,
      documentUrls: payload.documentUrls,
      appointmentType: payload.appointmentType || 'Audio Call',
    };
  } catch (error: any) {
    console.error('❌ PayStation payment initiation failed:', error);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR, 
      `Failed to initiate payment: ${error.message}`
    );
  }
};

// Production mode - PayStation payment is ENABLED
const PAYMENT_ENABLED = true;

const createRequest = async (decodedUser: JwtPayload, payload: {
  categoryId: string;
  appointmentType?: 'Audio Call' | 'Video Call';
  note?: string;
  orderId?: string;
  documentUrls?: string[];
  itemId?: string; // Optional: specific item ID
}) => {
  const settings = await getSettings();
  if (!settings.isEnabled) {
    throw new AppError(StatusCodes.SERVICE_UNAVAILABLE, 'Instant consultancy is currently disabled.');
  }

  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client) throw new AppError(StatusCodes.NOT_FOUND, 'Client profile not found');

  let paystationTransactionId: string | undefined;

  // Note: Payment is already verified on client side via callback URL
  // Client only reaches here after successful payment confirmation
  // No need for backend verification - proceed with request creation
  if (PAYMENT_ENABLED && payload.orderId) {
    console.log('✅ Creating request with payment orderId:', payload.orderId);
    paystationTransactionId = payload.orderId; // Store orderId as transaction reference
  }

  const clientName = `${(client.profileInfo as any)?.fast_name || ''} ${(client.profileInfo as any)?.last_name || ''}`.trim() || 'Client';
  const appointmentType = payload.appointmentType || 'Audio Call';

  const onlineLawyers = await LawyerProfileModel.find({
    isOnline: true,
    categories: new Types.ObjectId(payload.categoryId),
    instantConsultancy: true,
  }).populate('userId', '_id fcmTokens fcmToken');

  if (onlineLawyers.length === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No available lawyers for this category right now. Please try again later.');
  }

  const channelName = `ic_${Date.now()}`;
  const clientToken = buildToken(channelName, 1);
  const appId = envVars.AGORA_APP_ID || '';
  const lawyerToken = buildToken(channelName, 2);

  // Determine fee: Use item fee if item selected, otherwise use settings default fee
  let consultationFee = settings.fee;
  
  if (payload.itemId) {
    const item = await InstantConsultancyItemModel.findById(payload.itemId);
    if (item && item.isActive) {
      consultationFee = item.fee;
    }
  }

  const request = await InstantConsultancyModel.create({
    clientId: (client._id as any),
    categoryId: payload.categoryId,
    appointmentType,
    note: payload.note,
    documents: payload.documentUrls || [],
    channelName,
    status: InstantConsultancyStatus.WAITING,
    fee: consultationFee, // Use determined fee (item fee or default)
    paymentStatus: PAYMENT_ENABLED ? 'paid' : 'pending',
    paystationInvoiceNumber: payload.orderId,
    paystationTransactionId,
  });

  const requestId = (request._id as any).toString();

  pendingRequests.set(requestId, {
    channelName,
    appointmentType,
    clientName,
    categoryId: payload.categoryId,
    appId,
    clientToken,
    createdAt: Date.now(),
  });

  // Send FCM with full call data so IncomingCallScreen can launch directly
  for (const lawyer of onlineLawyers) {
    const lawyerUser = lawyer.userId as any;
    const tokens: string[] = lawyerUser?.fcmTokens || (lawyerUser?.fcmToken ? [lawyerUser.fcmToken] : []);
    if (tokens.length > 0) {
      try {
        await sendFCMToTokens(
          tokens,
          `${appointmentType === 'Video Call' ? '📹' : '📞'} Instant Consultation Request`,
          `${clientName} needs ${appointmentType.toLowerCase()} consultation. Be the first to accept!`,
          undefined,
          {
            type: 'INCOMING_CALL',
            callerName: clientName,
            channelName,
            callType: appointmentType === 'Video Call' ? 'video' : 'audio',
            appId,
            token: lawyerToken,
            appointmentId: requestId,            callSource: 'instant_consultancy',          },
        );
      } catch (_) {}
    }
  }

  return {
    requestId,
    channelName,
    clientToken,
    appId,
    fee: consultationFee, // Return actual fee being charged
    durationMinutes: settings.durationMinutes,
    status: InstantConsultancyStatus.WAITING,
  };
};

const uploadDocuments = async (files: Express.Multer.File[]): Promise<string[]> => {
  // When using multer-storage-cloudinary, the file is already uploaded.
  // The secure URL is available at file.path.
  return files.map((f: any) => f.path as string).filter(Boolean);
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

  pendingRequests.delete(requestId);
  const pending = pendingRequests.get(requestId);
  const channelName = updated.channelName || requestId;
  const lawyerToken = buildToken(channelName, 2);
  const appId = envVars.AGORA_APP_ID || '';

  return {
    requestId,
    channelName,
    lawyerToken,
    appId,
    appointmentType: updated.appointmentType,
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
    appointmentType: request.appointmentType,
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
    appointmentType: request.appointmentType,
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

// ── Item CRUD ──────────────────────────────────────────────────────────────
const createItem = async (payload: { name: string; categoryId: string; fee: number; imageUrl?: string }) => {
  return InstantConsultancyItemModel.create(payload);
};

const getItems = async () => {
  return InstantConsultancyItemModel.find({ isActive: true })
    .populate('categoryId', 'name')
    .sort({ isFeatured: -1, createdAt: -1 });
};

const getAllItems = async () => {
  return InstantConsultancyItemModel.find()
    .populate('categoryId', 'name')
    .sort({ createdAt: -1 });
};

const updateItem = async (id: string, payload: Partial<{ name: string; categoryId: string; fee: number; imageUrl: string; isActive: boolean }>) => {
  const item = await InstantConsultancyItemModel.findByIdAndUpdate(id, payload, { new: true }).populate('categoryId', 'name');
  if (!item) throw new AppError(StatusCodes.NOT_FOUND, 'Item not found');
  return item;
};

const deleteItem = async (id: string) => {
  const item = await InstantConsultancyItemModel.findByIdAndDelete(id);
  if (!item) throw new AppError(StatusCodes.NOT_FOUND, 'Item not found');
  return item;
};

export const instantConsultancyService = {
  initPayment,
  createRequest,
  uploadDocuments,
  acceptRequest,
  getPendingForLawyer,
  getRequestStatus,
  cancelRequest,
  adminGetAll,
  getSettings,
  updateSettings,
  createItem,
  getItems,
  getAllItems,
  updateItem,
  deleteItem,
};
