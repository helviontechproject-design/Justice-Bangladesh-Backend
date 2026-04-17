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
exports.FirebaseMessagingService = void 0;
const firebase_1 = require("../config/firebase");
class FirebaseMessagingService {
    static sendNotification(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fcmTokens, title, body, data = {}, imageUrl } = payload;
                const validTokens = fcmTokens.filter(token => token && token.length > 0);
                if (validTokens.length === 0) {
                    throw new Error('No valid FCM tokens provided');
                }
                const response = yield firebase_1.messaging.sendEachForMulticast({
                    tokens: validTokens,
                    notification: Object.assign({ title,
                        body }, (imageUrl && { imageUrl })),
                    data: Object.assign(Object.assign({ title,
                        body }, (imageUrl && { imageUrl })), data),
                    android: {
                        priority: 'high',
                        notification: Object.assign({ title,
                            body, channelId: 'high_importance_channel', sound: 'default', clickAction: 'FLUTTER_NOTIFICATION_CLICK' }, (imageUrl && { imageUrl })),
                    },
                    apns: Object.assign({ headers: { 'apns-priority': '10' }, payload: {
                            aps: { sound: 'default', badge: 1 },
                        } }, (imageUrl && { fcmOptions: { imageUrl } })),
                });
                console.log(`[FCM] Success: ${response.successCount}/${validTokens.length}`);
                if (response.failureCount > 0) {
                    response.responses.forEach((r, i) => {
                        var _a;
                        if (!r.success)
                            console.error(`[FCM] Token ${i} failed:`, (_a = r.error) === null || _a === void 0 ? void 0 : _a.message);
                    });
                }
                return validTokens;
            }
            catch (error) {
                console.error('Error sending notification:', error);
                throw error;
            }
        });
    }
    static sendNotificationToTopic(topic, title, body, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield firebase_1.messaging.send({
                    notification: { title, body },
                    data,
                    topic,
                    android: {
                        priority: 'high',
                        notification: {
                            channelId: 'high_importance_channel',
                            sound: 'default',
                        },
                    },
                });
            }
            catch (error) {
                console.error('Error sending topic notification:', error);
                throw error;
            }
        });
    }
}
exports.FirebaseMessagingService = FirebaseMessagingService;
