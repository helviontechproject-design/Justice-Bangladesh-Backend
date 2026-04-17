import { FirebaseMessagingService } from './firebase-messaging.service';

export const sendFCMToTokens = async (
  tokens: string[],
  title: string,
  body: string,
  imageUrl?: string,
  data?: Record<string, string>
) => {
  try {
    await FirebaseMessagingService.sendNotification({
      fcmTokens: tokens,
      title,
      body,
      imageUrl,
      data,
    });
    console.log(`[FCM] Sent to ${tokens.length} tokens`);
  } catch (error: any) {
    console.error('[FCM] Error:', error.message);
  }
};
