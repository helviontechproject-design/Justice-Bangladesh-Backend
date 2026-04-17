import { Schema, model } from 'mongoose';
import { IConversation } from './conversation.interface';

const ConversationSchema = new Schema<IConversation>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
    lawyerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessageAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


export const ConversationModel = model<IConversation>('Conversation', ConversationSchema);
