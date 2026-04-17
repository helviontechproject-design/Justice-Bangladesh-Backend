import { Document, Types } from 'mongoose';

export interface IConversation extends Document {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId;
  lawyerUserId: Types.ObjectId;
  clientUserId: Types.ObjectId;
  isActive: boolean;
  unReadMessageCount?: number;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
