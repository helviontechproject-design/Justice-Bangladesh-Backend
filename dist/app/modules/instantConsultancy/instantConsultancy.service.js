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
const pendingRequests = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of pendingRequests.entries()) {
        if (now - val.createdAt > 120000)
            pendingRequests.delete(key);
    }
}, 15000);
const buildToken = (channelName, uid) => {
    const { AGORA_APP_ID, AGORA_APP_CERTIFICATE } = env_1.envVars;
    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE)
        return '';
    const expireTime = Math.floor(Date.now() / 1000) + 3600;
    return agora_token_1.RtcTokenBuilder.buildTokenWithUid(AGORA_APP_ID, AGORA_APP_CERTIFICATE, channelName, uid, agora_token_1.RtcRole.PUBLISHER, expireTime, expireTime);
};
const createRequest = (decodedUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found');
    const clientName = `${((_a = client.profileInfo) === null || _a === void 0 ? void 0 : _a.fast_name) || ''} ${((_b = client.profileInfo) === null || _b === void 0 ? void 0 : _b.last_name) || ''}`.trim() || 'Client';
    const onlineLawyers = yield lawyer_model_1.LawyerProfileModel.find({
        isOnline: true,
        categories: new mongoose_1.Types.ObjectId(payload.categoryId),
    }).populate('userId', '_id fcmTokens');
    if (onlineLawyers.length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No available lawyers for this category right now. Please try again later.');
    }
    const channelName = `ic_${Date.now()}`;
    const clientToken = buildToken(channelName, 1);
    const appId = env_1.envVars.AGORA_APP_ID || '';
    const request = yield instantConsultancy_model_1.InstantConsultancyModel.create({
        clientId: client._id,
        categoryId: payload.categoryId,
        callType: payload.callType || 'audio',
        note: payload.note,
        channelName,
        status: instantConsultancy_interface_1.InstantConsultancyStatus.WAITING,
    });
    const requestId = request._id.toString();
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
        const lawyerUser = lawyer.userId;
        const tokens = (lawyerUser === null || lawyerUser === void 0 ? void 0 : lawyerUser.fcmTokens) || ((lawyerUser === null || lawyerUser === void 0 ? void 0 : lawyerUser.fcmToken) ? [lawyerUser.fcmToken] : []);
        if (tokens.length > 0) {
            try {
                yield (0, fcm_1.sendFCMToTokens)(tokens, '📞 Instant Consultation Request', `${clientName} needs ${payload.callType || 'audio'} consultation. Be the first to accept!`);
            }
            catch (_) { }
        }
    }
    return {
        requestId,
        channelName,
        clientToken,
        appId,
        status: instantConsultancy_interface_1.InstantConsultancyStatus.WAITING,
    };
});
const acceptRequest = (decodedUser, requestId) => __awaiter(void 0, void 0, void 0, function* () {
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({ userId: decodedUser.userId });
    if (!lawyer)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer profile not found');
    const updated = yield instantConsultancy_model_1.InstantConsultancyModel.findOneAndUpdate({ _id: requestId, status: instantConsultancy_interface_1.InstantConsultancyStatus.WAITING }, { lawyerId: lawyer._id, status: instantConsultancy_interface_1.InstantConsultancyStatus.ACCEPTED }, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Request already accepted by another lawyer');
    }
    const pending = pendingRequests.get(requestId);
    const channelName = updated.channelName || requestId;
    const lawyerToken = buildToken(channelName, 2);
    const appId = env_1.envVars.AGORA_APP_ID || '';
    return {
        requestId,
        channelName,
        lawyerToken,
        appId,
        callType: updated.callType,
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
        callType: request.callType,
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
        callType: request.callType,
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
exports.instantConsultancyService = {
    createRequest,
    acceptRequest,
    getPendingForLawyer,
    getRequestStatus,
    cancelRequest,
    adminGetAll,
};
