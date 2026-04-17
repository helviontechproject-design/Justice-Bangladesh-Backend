import { Request, Response } from 'express';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { envVars } from '../../config/env';
import { Appointment } from '../appointment/appointment.model';
import { UserModel } from '../user/user.model';
import { sendFCMToTokens } from '../../utils/fcm';

// In-memory pending calls: lawyerUserId -> call info
const pendingCalls = new Map<string, {
  channelName: string;
  callType: string;
  callerName: string;
  appointmentId: string;
  lawyerToken: string;
  appId: string;
  createdAt: number;
}>();

// Clean stale calls older than 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingCalls.entries()) {
    if (now - val.createdAt > 60000) pendingCalls.delete(key);
  }
}, 10000);

const buildToken = (channelName: string, uid: number): string => {
  const appId = envVars.AGORA_APP_ID;
  const appCertificate = envVars.AGORA_APP_CERTIFICATE;
  if (!appId || !appCertificate) return '';
  const expireTime = Math.floor(Date.now() / 1000) + 3600;
  return RtcTokenBuilder.buildTokenWithUid(
    appId, appCertificate, channelName,
    uid, RtcRole.PUBLISHER, expireTime, expireTime,
  );
};

// POST /agora/token
export const generateAgoraToken = (req: Request, res: Response) => {
  const { channelName, uid } = req.body;
  if (!channelName || uid === undefined) {
    return res.status(400).json({ success: false, message: 'channelName and uid are required' });
  }
  const appId = envVars.AGORA_APP_ID;
  const appCertificate = envVars.AGORA_APP_CERTIFICATE;
  if (!appId || !appCertificate) {
    return res.status(500).json({ success: false, message: 'Agora credentials not configured' });
  }
  const expireTime = Math.floor(Date.now() / 1000) + 3600;
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId, appCertificate, channelName,
    Number(uid), RtcRole.PUBLISHER, expireTime, expireTime,
  );
  return res.status(200).json({ success: true, data: { token, appId, channelName, uid } });
};

// POST /agora/call/initiate — client initiates call
export const initiateCall = async (req: Request, res: Response) => {
  try {
    const { appointmentId, callType } = req.body;

    const appointment = await Appointment.findById(appointmentId)
      .populate({ path: 'lawyerId', select: 'userId profile_Details', populate: { path: 'userId', select: 'fcmTokens' } })
      .populate('clientId', 'profileInfo');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const lawyerProfile = appointment.lawyerId as any;
    const lawyerUserId = lawyerProfile?.userId?._id?.toString() || lawyerProfile?.userId?.toString();
    if (!lawyerUserId) {
      return res.status(404).json({ success: false, message: 'Lawyer not found' });
    }

    // Fix: clientId uses profileInfo not profile_Details
    const clientProfile = appointment.clientId as any;
    const callerName = [
      clientProfile?.profileInfo?.fast_name || '',
      clientProfile?.profileInfo?.last_name || '',
    ].join(' ').trim() || 'Client';

    const channelName = appointmentId.toString();
    // uid: client = 1, lawyer = 2
    const lawyerToken = buildToken(channelName, 2);
    const appId = envVars.AGORA_APP_ID || '';

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
    const lawyerUser = await UserModel.findById(lawyerUserId).select('fcmTokens');
    const fcmTokens: string[] = lawyerUser?.fcmTokens ?? [];
    if (fcmTokens.length > 0) {
      await sendFCMToTokens(
        fcmTokens,
        callType === 'video' ? 'Incoming Video Call' : 'Incoming Audio Call',
        `${callerName} is calling you`,
        undefined,
        {
          type: 'INCOMING_CALL',
          callType: callType || 'audio',
          channelName,
          appId,
          token: lawyerToken,
          appointmentId: channelName,
          callerName,
        },
      );
    }

    return res.status(200).json({ success: true, data: { channelName, appId } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /agora/call/pending — lawyer polls for incoming call
export const getPendingCall = (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || req.query.userId as string;
  if (!userId) return res.status(200).json({ success: true, data: null });
  const call = pendingCalls.get(userId);
  return res.status(200).json({ success: true, data: call || null });
};

// POST /agora/call/reject — lawyer rejects or call ended
export const rejectCall = (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { appointmentId } = req.body;
  if (userId) pendingCalls.delete(userId);
  if (appointmentId) {
    for (const [key, val] of pendingCalls.entries()) {
      if (val.appointmentId === appointmentId) pendingCalls.delete(key);
    }
  }
  return res.status(200).json({ success: true });
};
