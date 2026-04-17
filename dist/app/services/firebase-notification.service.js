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
const firebase_1 = require("../config/firebase");
class FirebaseNotificationService {
    /**
     * Send notification to single or multiple FCM tokens
     */
    static sendNotification(_a) {
        return __awaiter(this, arguments, void 0, function* ({ title, body, fcmTokens, data = {}, imageUrl, }) {
            try {
                // Filter valid tokens
                const validTokens = fcmTokens.filter((token) => token && token.trim());
                if (validTokens.length === 0) {
                    console.warn('No valid FCM tokens provided');
                    return null;
                }
                const message = {
                    notification: Object.assign({ title,
                        body }, (imageUrl && { imageUrl })),
                    data: Object.assign(Object.assign({ title,
                        body }, (imageUrl && { imageUrl })), Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))),
                    android: {
                        priority: 'high',
                        notification: Object.assign(Object.assign({ title,
                            body, clickAction: 'FLUTTER_NOTIFICATION_CLICK' }, (imageUrl && { imageUrl })), { sound: 'default', channelId: 'high_importance_channel' }),
                    },
                    apns: Object.assign({ headers: {
                            'apns-priority': '10',
                        }, payload: {
                            aps: {
                                sound: 'default',
                                badge: 1,
                            },
                        } }, (imageUrl && {
                        fcmOptions: { imageUrl },
                    })),
                };
                // Send to multiple tokens
                const response = yield firebase_1.messaging.sendEachForMulticast(Object.assign(Object.assign({}, message), { tokens: validTokens }));
                console.log(`Successfully sent notifications: ${response.successCount}`);
                console.log(`Failed notifications: ${response.failureCount}`);
                return {
                    successCount: response.successCount,
                    failureCount: response.failureCount,
                };
            }
            catch (error) {
                console.error('Error sending notification:', error);
                throw error;
            }
        });
    }
    /**
     * Send notification to a topic
     */
    static sendNotificationToTopic(_a) {
        return __awaiter(this, arguments, void 0, function* ({ title, body, topic, data = {}, imageUrl, }) {
            try {
                const message = {
                    notification: Object.assign({ title,
                        body }, (imageUrl && { imageUrl })),
                    data,
                    topic,
                };
                const response = yield firebase_1.messaging.send(message);
                console.log('Successfully sent topic notification:', response);
                return response;
            }
            catch (error) {
                console.error('Error sending topic notification:', error);
                throw error;
            }
        });
    }
    /**
     * Subscribe user to a topic
     */
    static subscribeToTopic(fcmTokens, topic) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validTokens = fcmTokens.filter((token) => token && token.trim());
                if (validTokens.length === 0) {
                    console.warn('No valid FCM tokens provided');
                    return null;
                }
                const response = yield firebase_1.messaging.subscribeToTopic(validTokens, topic);
                console.log(`Successfully subscribed ${response} devices to topic: ${topic}`);
                return response;
            }
            catch (error) {
                console.error('Error subscribing to topic:', error);
                throw error;
            }
        });
    }
    /**
     * Unsubscribe user from a topic
     */
    static unsubscribeFromTopic(fcmTokens, topic) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validTokens = fcmTokens.filter((token) => token && token.trim());
                if (validTokens.length === 0) {
                    console.warn('No valid FCM tokens provided');
                    return null;
                }
                const response = yield firebase_1.messaging.unsubscribeFromTopic(validTokens, topic);
                console.log(`Successfully unsubscribed ${response} devices from topic: ${topic}`);
                return response;
            }
            catch (error) {
                console.error('Error unsubscribing from topic:', error);
                throw error;
            }
        });
    }
    /**
     * Send notifications to multiple users based on their FCM tokens
     */
    static broadcastNotification(_a) {
        return __awaiter(this, arguments, void 0, function* ({ title, body, userFcmTokens, data = {}, imageUrl, }) {
            try {
                const allTokens = Object.values(userFcmTokens).flat();
                return yield this.sendNotification({
                    title,
                    body,
                    fcmTokens: allTokens,
                    data,
                    imageUrl,
                });
            }
            catch (error) {
                console.error('Error broadcasting notification:', error);
                throw error;
            }
        });
    }
}
exports.default = FirebaseNotificationService;
