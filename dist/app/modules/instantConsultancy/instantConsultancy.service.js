"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.instantConsultancyService = void 0;
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = require("mongoose");
const agora_token_1 = require("agora-token");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const client_model_1 = require("../client/client.model");
const lawyer_model_1 = require("../lawyer/lawyer.model");
const instantConsultancy_model_1 = require("./instantConsultancy.model");
const instantConsultancy_interface_1 = require("./instantConsultancy.interface");
const env_1 = require("../../config/env");
const fcm_1 = require("../../utils/fcm");
const bkash_service_1 = require("../bkash/bkash.service");
const REQUEST_EXPIRE_MS = 120000;
const pendingRequests = new Map();
const expirePendingRequests = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = Date.now();
    for (const [key, val] of pendingRequests.entries()) {
        if (now - val.createdAt > REQUEST_EXPIRE_MS) {
            pendingRequests.delete(key);
            yield instantConsultancy_model_1.InstantConsultancyModel.findOneAndUpdate({ _id: key, status: instantConsultancy_interface_1.InstantConsultancyStatus.WAITING }, { status: instantConsultancy_interface_1.InstantConsultancyStatus.EXPIRED });
        }
    }
});
setInterval(() => {
    expirePendingRequests().catch(() => { });
}, 15000);
const buildToken = (channelName, uid) => {
    const { AGORA_APP_ID, AGORA_APP_CERTIFICATE } = env_1.envVars;
    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE)
        return '';
    const expireTime = Math.floor(Date.now() / 1000) + 3600;
    return agora_token_1.RtcTokenBuilder.buildTokenWithUid(AGORA_APP_ID, AGORA_APP_CERTIFICATE, channelName, uid, agora_token_1.RtcRole.PUBLISHER, expireTime, expireTime);
};
const getSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    let settings = yield instantConsultancy_model_1.InstantConsultancySettingsModel.findOne();
    if (!settings) {
        settings = yield instantConsultancy_model_1.InstantConsultancySettingsModel.create({
            fee: instantConsultancy_interface_1.INSTANT_CONSULTATION_FEE,
            durationMinutes: 10,
            isEnabled: true,
        });
    }
    return settings;
});
const updateSettings = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    let settings = yield instantConsultancy_model_1.InstantConsultancySettingsModel.findOne();
    if (!settings) {
        settings = yield instantConsultancy_model_1.InstantConsultancySettingsModel.create(Object.assign({}, payload));
    }
    else {
        if (payload.fee !== undefined)
            settings.fee = payload.fee;
        if (payload.durationMinutes !== undefined)
            settings.durationMinutes = payload.durationMinutes;
        if (payload.isEnabled !== undefined)
            settings.isEnabled = payload.isEnabled;
        yield settings.save();
    }
    return settings;
});
const initPayment = (decodedUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!PAYMENT_ENABLED) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_IMPLEMENTED, 'Payment is currently disabled. Use /request directly.');
    }
    const settings = yield getSettings();
    if (!settings.isEnabled) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE, 'Instant consultancy is currently disabled.');
    }
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found');
    const onlineLawyers = yield lawyer_model_1.LawyerProfileModel.find({
        isOnline: true,
        categories: new mongoose_1.Types.ObjectId(payload.categoryId),
    });
    if (onlineLawyers.length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No available lawyers for this category right now. Please try again later.');
    }
    const orderId = `IC-${Date.now()}-${client._id.toString().slice(-4)}`;
    const bkashRes = yield bkash_service_1.BkashService.createPayment({
        amount: String(settings.fee),
        orderId,
        merchantInvoiceNumber: orderId,
    });
    if (bkashRes.statusCode !== '0000') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, bkashRes.statusMessage || 'bKash payment init failed');
    }
    // Store pending meta in memory until payment is executed
    pendingRequests.set(orderId, {
        channelName: '',
        appointmentType: payload.appointmentType || 'Audio Call',
        clientName: `${((_a = client.profileInfo) === null || _a === void 0 ? void 0 : _a.fast_name) || ''} ${((_b = client.profileInfo) === null || _b === void 0 ? void 0 : _b.last_name) || ''}`.trim() || 'Client',
        categoryId: payload.categoryId,
        appId: env_1.envVars.AGORA_APP_ID || '',
        clientToken: '',
        createdAt: Date.now(),
    });
    return {
        bkashURL: bkashRes.bkashURL,
        paymentID: bkashRes.paymentID,
        orderId,
        fee: settings.fee,
        note: payload.note,
        documentUrls: payload.documentUrls,
        appointmentType: payload.appointmentType || 'Audio Call',
    };
});
// Set to true when bKash is ready to go live
const PAYMENT_ENABLED = false;
const createRequest = (decodedUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const settings = yield getSettings();
    if (!settings.isEnabled) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE, 'Instant consultancy is currently disabled.');
    }
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found');
    let bkashTrxID;
    if (PAYMENT_ENABLED) {
        if (!payload.bkashPaymentID) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'bkashPaymentID is required');
        }
        // Sanitize bkashPaymentID — only allow alphanumeric, hyphens and underscores
        if (!/^[a-zA-Z0-9\-_]+$/.test(payload.bkashPaymentID)) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid bkashPaymentID format');
        }
        const executeRes = yield bkash_service_1.BkashService.executePayment(payload.bkashPaymentID);
        if (executeRes.transactionStatus !== 'Completed') {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Payment not completed: ${executeRes.statusMessage}`);
        }
        bkashTrxID = executeRes.trxID;
    }
    const clientName = `${((_a = client.profileInfo) === null || _a === void 0 ? void 0 : _a.fast_name) || ''} ${((_b = client.profileInfo) === null || _b === void 0 ? void 0 : _b.last_name) || ''}`.trim() || 'Client';
    const appointmentType = payload.appointmentType || 'Audio Call';
    const onlineLawyers = yield lawyer_model_1.LawyerProfileModel.find({
        isOnline: true,
        categories: new mongoose_1.Types.ObjectId(payload.categoryId),
    }).populate('userId', '_id fcmTokens fcmToken');
    if (onlineLawyers.length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No available lawyers for this category right now. Please try again later.');
    }
    const channelName = `ic_${Date.now()}`;
    const clientToken = buildToken(channelName, 1);
    const appId = env_1.envVars.AGORA_APP_ID || '';
    const lawyerToken = buildToken(channelName, 2);
    const request = yield instantConsultancy_model_1.InstantConsultancyModel.create({
        clientId: client._id,
        categoryId: payload.categoryId,
        appointmentType,
        note: payload.note,
        documents: payload.documentUrls || [],
        channelName,
        status: instantConsultancy_interface_1.InstantConsultancyStatus.WAITING,
        fee: settings.fee,
        paymentStatus: PAYMENT_ENABLED ? 'paid' : 'pending',
        bkashPaymentID: payload.bkashPaymentID,
        bkashTrxID,
    });
    const requestId = request._id.toString();
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
        const lawyerUser = lawyer.userId;
        const tokens = (lawyerUser === null || lawyerUser === void 0 ? void 0 : lawyerUser.fcmTokens) || ((lawyerUser === null || lawyerUser === void 0 ? void 0 : lawyerUser.fcmToken) ? [lawyerUser.fcmToken] : []);
        if (tokens.length > 0) {
            try {
                yield (0, fcm_1.sendFCMToTokens)(tokens, `${appointmentType === 'Video Call' ? '📹' : '📞'} Instant Consultation Request`, `${clientName} needs ${appointmentType.toLowerCase()} consultation. Be the first to accept!`, undefined, {
                    type: 'INCOMING_CALL',
                    callerName: clientName,
                    channelName,
                    callType: appointmentType === 'Video Call' ? 'video' : 'audio',
                    appId,
                    token: lawyerToken,
                    appointmentId: requestId, callSource: 'instant_consultancy',
                });
            }
            catch (_) { }
        }
    }
    return {
        requestId,
        channelName,
        clientToken,
        appId,
        fee: settings.fee,
        durationMinutes: settings.durationMinutes,
        status: instantConsultancy_interface_1.InstantConsultancyStatus.WAITING,
    };
});
const uploadDocuments = (files) => __awaiter(void 0, void 0, void 0, function* () {
    // When using multer-storage-cloudinary, the file is already uploaded.
    // The secure URL is available at file.path.
    return files.map((f) => f.path).filter(Boolean);
});
const acceptRequest = (decodedUser, requestId) => __awaiter(void 0, void 0, void 0, function* () {
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({ userId: decodedUser.userId });
    if (!lawyer)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer profile not found');
    const updated = yield instantConsultancy_model_1.InstantConsultancyModel.findOneAndUpdate({ _id: requestId, status: instantConsultancy_interface_1.InstantConsultancyStatus.WAITING }, { lawyerId: lawyer._id, status: instantConsultancy_interface_1.InstantConsultancyStatus.ACCEPTED }, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Request already accepted by another lawyer');
    }
    pendingRequests.delete(requestId);
    const pending = pendingRequests.get(requestId);
    const channelName = updated.channelName || requestId;
    const lawyerToken = buildToken(channelName, 2);
    const appId = env_1.envVars.AGORA_APP_ID || '';
    return {
        requestId,
        channelName,
        lawyerToken,
        appId,
        appointmentType: updated.appointmentType,
        clientName: (pending === null || pending === void 0 ? void 0 : pending.clientName) || 'Client',
    };
});
const getPendingForLawyer = (decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({ userId: decodedUser.userId })
        .populate('categories', '_id name');
    if (!lawyer)
        return null;
    const categoryIds = lawyer.categories.map((c) => c._id || c);
    const request = yield instantConsultancy_model_1.InstantConsultancyModel.findOne({
        status: instantConsultancy_interface_1.InstantConsultancyStatus.WAITING,
        categoryId: { $in: categoryIds },
    })
        .populate('clientId', 'profileInfo')
        .populate('categoryId', 'name')
        .sort({ createdAt: 1 });
    if (!request)
        return null;
    const pending = pendingRequests.get(request._id.toString());
    return {
        requestId: request._id.toString(),
        channelName: request.channelName,
        appointmentType: request.appointmentType,
        clientName: (pending === null || pending === void 0 ? void 0 : pending.clientName) || 'Client',
        categoryName: ((_a = request.categoryId) === null || _a === void 0 ? void 0 : _a.name) || '',
        appId: env_1.envVars.AGORA_APP_ID || '',
    };
});
const getRequestStatus = (requestId) => __awaiter(void 0, void 0, void 0, function* () {
    const request = yield instantConsultancy_model_1.InstantConsultancyModel.findById(requestId)
        .populate('lawyerId', 'profile_Details avarage_rating')
        .populate('categoryId', 'name');
    if (!request)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Request not found');
    let lawyerToken = null;
    if (request.status === instantConsultancy_interface_1.InstantConsultancyStatus.ACCEPTED && request.channelName) {
        lawyerToken = buildToken(request.channelName, 2);
    }
    return {
        requestId: request._id.toString(),
        status: request.status,
        channelName: request.channelName,
        appointmentType: request.appointmentType,
        appId: env_1.envVars.AGORA_APP_ID || '',
        lawyerToken,
        lawyer: request.lawyerId,
    };
});
const cancelRequest = (decodedUser, requestId) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client not found');
    const request = yield instantConsultancy_model_1.InstantConsultancyModel.findOneAndUpdate({ _id: requestId, clientId: client._id, status: instantConsultancy_interface_1.InstantConsultancyStatus.WAITING }, { status: instantConsultancy_interface_1.InstantConsultancyStatus.CANCELLED }, { new: true });
    if (!request)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Request not found or already accepted');
    pendingRequests.delete(requestId);
    return request;
});
const adminGetAll = () => __awaiter(void 0, void 0, void 0, function* () {
    return instantConsultancy_model_1.InstantConsultancyModel.find()
        .populate('clientId', 'profileInfo')
        .populate('lawyerId', 'profile_Details')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 });
});
// ── Item CRUD ──────────────────────────────────────────────────────────────
const createItem = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return instantConsultancy_model_1.InstantConsultancyItemModel.create(payload);
});
const getItems = () => __awaiter(void 0, void 0, void 0, function* () {
    return instantConsultancy_model_1.InstantConsultancyItemModel.find({ isActive: true })
        .populate('categoryId', 'name')
        .sort({ isFeatured: -1, createdAt: -1 });
});
const getAllItems = () => __awaiter(void 0, void 0, void 0, function* () {
    return instantConsultancy_model_1.InstantConsultancyItemModel.find()
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 });
});
const updateItem = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const item = yield instantConsultancy_model_1.InstantConsultancyItemModel.findByIdAndUpdate(id, payload, { new: true }).populate('categoryId', 'name');
    if (!item)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Item not found');
    return item;
});
const deleteItem = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const item = yield instantConsultancy_model_1.InstantConsultancyItemModel.findByIdAndDelete(id);
    if (!item)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Item not found');
    return item;
});
exports.instantConsultancyService = {
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
