import { Schema, model } from 'mongoose';
import { IMessage } from './message.interface';

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['CLIENT', 'LAWYER'],
      required: true,
    },
    contentType: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' }, emoji: String, _id: false,
      }
    ],
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    content: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    imageOrFileUrl: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


export const MessageModel = model<IMessage>('Message', MessageSchema);
