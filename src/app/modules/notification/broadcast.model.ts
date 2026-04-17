import { Schema, model } from 'mongoose';
import { IBroadcastNotification, ERecipientType } from './broadcast.interface';

const BroadcastNotificationSchema = new Schema<IBroadcastNotification>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String },
    recipientType: { type: String, enum: Object.values(ERecipientType), default: ERecipientType.ALL },
    deliveryCount: { type: Number, default: 0 },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const BroadcastNotification = model<IBroadcastNotification>(
  'BroadcastNotification',
  BroadcastNotificationSchema
);
