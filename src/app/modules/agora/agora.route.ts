import { Router } from 'express';
import { generateAgoraToken, initiateCall, rejectCall, getPendingCall } from './agora.controller';
import { checkAuth } from '../../middlewares/checkAuth';

export const agoraRoute = Router();

agoraRoute.post('/token', checkAuth('CLIENT', 'LAWYER'), generateAgoraToken);
agoraRoute.post('/call/initiate', checkAuth('CLIENT'), initiateCall);
agoraRoute.get('/call/pending', getPendingCall);
agoraRoute.post('/call/reject', checkAuth('LAWYER', 'CLIENT'), rejectCall);
