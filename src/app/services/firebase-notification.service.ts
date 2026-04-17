import { messaging } from '../config/firebase';

interface SendNotificationPayload {
  title: string;
  body: string;
  fcmTokens: string[];
  data?: Record<string, string>;
  imageUrl?: string;
}

interface SendNotificationToTopicPayload {
  title: string;
  body: string;
  topic: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

class FirebaseNotificationService {
  /**
   * Send notification to single or multiple FCM tokens
   */
  static async sendNotification({
    title,
    body,
    fcmTokens,
    data = {},
    imageUrl,
  }: SendNotificationPayload) {
    try {
      // Filter valid tokens
      const validTokens = fcmTokens.filter((token) => token && token.trim());

      if (validTokens.length === 0) {
        console.warn('No valid FCM tokens provided');
        return null;
      }

      const message = {
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        data: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
          ...Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
          ),
        },
        android: {
          priority: 'high' as const,
          notification: {
            title,
            body,
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            ...(imageUrl && { imageUrl }),
            sound: 'default',
            channelId: 'high_importance_channel',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
          ...(imageUrl && {
            fcmOptions: { imageUrl },
          }),
        },
      };

      // Send to multiple tokens
      const response = await messaging.sendEachForMulticast({
        ...message,
        tokens: validTokens,
      });

      console.log(`Successfully sent notifications: ${response.successCount}`);
      console.log(`Failed notifications: ${response.failureCount}`);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to a topic
   */
  static async sendNotificationToTopic({
    title,
    body,
    topic,
    data = {},
    imageUrl,
  }: SendNotificationToTopicPayload) {
    try {
      const message = {
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        data,
        topic,
      };

      const response = await messaging.send(message as any);

      console.log('Successfully sent topic notification:', response);
      return response;
    } catch (error) {
      console.error('Error sending topic notification:', error);
      throw error;
    }
  }

  /**
   * Subscribe user to a topic
   */
  static async subscribeToTopic(fcmTokens: string[], topic: string) {
    try {
      const validTokens = fcmTokens.filter((token) => token && token.trim());

      if (validTokens.length === 0) {
        console.warn('No valid FCM tokens provided');
        return null;
      }

      const response = await messaging.subscribeToTopic(validTokens, topic);

      console.log(`Successfully subscribed ${response} devices to topic: ${topic}`);
      return response;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe user from a topic
   */
  static async unsubscribeFromTopic(fcmTokens: string[], topic: string) {
    try {
      const validTokens = fcmTokens.filter((token) => token && token.trim());

      if (validTokens.length === 0) {
        console.warn('No valid FCM tokens provided');
        return null;
      }

      const response = await messaging.unsubscribeFromTopic(validTokens, topic);

      console.log(
        `Successfully unsubscribed ${response} devices from topic: ${topic}`
      );
      return response;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  /**
   * Send notifications to multiple users based on their FCM tokens
   */
  static async broadcastNotification({
    title,
    body,
    userFcmTokens,
    data = {},
    imageUrl,
  }: {
    title: string;
    body: string;
    userFcmTokens: { [key: string]: string[] }; // { userId: [tokens] }
    data?: Record<string, string>;
    imageUrl?: string;
  }) {
    try {
      const allTokens = Object.values(userFcmTokens).flat();
      return await this.sendNotification({
        title,
        body,
        fcmTokens: allTokens,
        data,
        imageUrl,
      });
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }
}

export default FirebaseNotificationService;
