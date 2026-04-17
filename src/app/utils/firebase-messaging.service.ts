import { messaging } from '../config/firebase';

interface SendNotificationPayload {
  fcmTokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export class FirebaseMessagingService {
  static async sendNotification(payload: SendNotificationPayload): Promise<string[]> {
    try {
      const { fcmTokens, title, body, data = {}, imageUrl } = payload;

      const validTokens = fcmTokens.filter(token => token && token.length > 0);
      if (validTokens.length === 0) {
        throw new Error('No valid FCM tokens provided');
      }

      const response = await messaging.sendEachForMulticast({
        tokens: validTokens,
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        data: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
          ...data,
        },
        android: {
          priority: 'high',
          notification: {
            title,
            body,
            channelId: 'high_importance_channel',
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            ...(imageUrl && { imageUrl }),
          },
        },
        apns: {
          headers: { 'apns-priority': '10' },
          payload: {
            aps: { sound: 'default', badge: 1 },
          },
          ...(imageUrl && { fcmOptions: { imageUrl } }),
        },
      });

      console.log(`[FCM] Success: ${response.successCount}/${validTokens.length}`);
      if (response.failureCount > 0) {
        response.responses.forEach((r, i) => {
          if (!r.success) console.error(`[FCM] Token ${i} failed:`, r.error?.message);
        });
      }

      return validTokens;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  static async sendNotificationToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      await messaging.send({
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
      } as any);
    } catch (error) {
      console.error('Error sending topic notification:', error);
      throw error;
    }
  }
}
