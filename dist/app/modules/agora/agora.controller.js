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
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectCall = exports.getPendingCall = exports.initiateCall = exports.generateAgoraToken = void 0;
const agora_token_1 = require("agora-token");
const env_1 = require("../../config/env");
const appointment_model_1 = require("../appointment/appointment.model");
const user_model_1 = require("../user/user.model");
const fcm_1 = require("../../utils/fcm");
// In-memory pending calls: lawyerUserId -> call info
const pendingCalls = new Map();
// Clean stale calls older than 60s
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of pendingCalls.entries()) {
        if (now - val.createdAt > 60000)
            pendingCalls.delete(key);
    }
}, 10000);
const buildToken = (channelName, uid) => {
    const appId = env_1.envVars.AGORA_APP_ID;
    const appCertificate = env_1.envVars.AGORA_APP_CERTIFICATE;
    if (!appId || !appCertificate)
        return '';
    const expireTime = Math.floor(Date.now() / 1000) + 3600;
    return agora_token_1.RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, agora_token_1.RtcRole.PUBLISHER, expireTime, expireTime);
};
// POST /agora/token
const generateAgoraToken = (req, res) => {
    const { channelName, uid } = req.body;
    if (!channelName || uid === undefined) {
        return res.status(400).json({ success: false, message: 'channelName and uid are required' });
    }
    const appId = env_1.envVars.AGORA_APP_ID;
    const appCertificate = env_1.envVars.AGORA_APP_CERTIFICATE;
    if (!appId || !appCertificate) {
        return res.status(500).json({ success: false, message: 'Agora credentials not configured' });
    }
    const expireTime = Math.floor(Date.now() / 1000) + 3600;
    const token = agora_token_1.RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, Number(uid), agora_token_1.RtcRole.PUBLISHER, expireTime, expireTime);
    return res.status(200).json({ success: true, data: { token, appId, channelName, uid } });
};
exports.generateAgoraToken = generateAgoraToken;
// POST /agora/call/initiate — client initiates call
const initiateCall = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { appointmentId, callType } = req.body;
        const appointment = yield appointment_model_1.Appointment.findById(appointmentId)
            .populate({ path: 'lawyerId', select: 'userId profile_Details', populate: { path: 'userId', select: 'fcmTokens' } })
            .populate('clientId', 'profileInfo');
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        const lawyerProfile = appointment.lawyerId;
        const lawyerUserId = ((_b = (_a = lawyerProfile === null || lawyerProfile === void 0 ? void 0 : lawyerProfile.userId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = lawyerProfile === null || lawyerProfile === void 0 ? void 0 : lawyerProfile.userId) === null || _c === void 0 ? void 0 : _c.toString());
        if (!lawyerUserId) {
            return res.status(404).json({ success: false, message: 'Lawyer not found' });
        }
        // Fix: clientId uses profileInfo not profile_Details
        const clientProfile = appointment.clientId;
        const callerName = [
            ((_d = clientProfile === null || clientProfile === void 0 ? void 0 : clientProfile.profileInfo) === null || _d === void 0 ? void 0 : _d.fast_name) || '',
            ((_e = clientProfile === null || clientProfile === void 0 ? void 0 : clientProfile.profileInfo) === null || _e === void 0 ? void 0 : _e.last_name) || '',
        ].join(' ').trim() || 'Client';
        const channelName = appointmentId.toString();
        // uid: client = 1, lawyer = 2
        const lawyerToken = buildToken(channelName, 2);
        const appId = env_1.envVars.AGORA_APP_ID || '';
        pendingCalls.set(lawyerUserId, {
            channelName,
            callType: callType || 'audio',
            callerName,
            appointmentId: channelName,
            lawyerToken,
            appId,
            createdAt: Date.now(),
        });
        // Send FCM push notification to lawyer so IncomingCallScreen shows
        // even when the app is in background / terminated.
        const lawyerUser = yield user_model_1.UserModel.findById(lawyerUserId).select('fcmTokens');
        const fcmTokens = (_f = lawyerUser === null || lawyerUser === void 0 ? void 0 : lawyerUser.fcmTokens) !== null && _f !== void 0 ? _f : [];
        if (fcmTokens.length > 0) {
            yield (0, fcm_1.sendFCMToTokens)(fcmTokens, callType === 'video' ? 'Incoming Video Call' : 'Incoming Audio Call', `${callerName} is calling you`, undefined, {
                type: 'INCOMING_CALL',
                callType: callType || 'audio',
                channelName,
                appId,
                token: lawyerToken,
                appointmentId: channelName,
                callerName,
            });
        }
        return res.status(200).json({ success: true, data: { channelName, appId } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.initiateCall = initiateCall;
// GET /agora/call/pending — lawyer polls for incoming call
const getPendingCall = (req, res) => {
    var _a;
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || req.query.userId;
    if (!userId)
        return res.status(200).json({ success: true, data: null });
    const call = pendingCalls.get(userId);
    return res.status(200).json({ success: true, data: call || null });
};
exports.getPendingCall = getPendingCall;
// POST /agora/call/reject — lawyer rejects or call ended
const rejectCall = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const { appointmentId } = req.body;
    if (userId)
        pendingCalls.delete(userId);
    if (appointmentId) {
        for (const [key, val] of pendingCalls.entries()) {
            if (val.appointmentId === appointmentId)
                pendingCalls.delete(key);
        }
    }
    return res.status(200).json({ success: true });
};
exports.rejectCall = rejectCall;
