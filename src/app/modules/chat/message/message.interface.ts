import { Document, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: 'CLIENT' | 'LAWYER';
  receiver: Types.ObjectId;
  content: string;
  imageOrFileUrl: string;
  contentType: 'text' | 'image' | 'file';
  reactions: {
    userId: Types.ObjectId;
    emoji: string;
  }[];
  isDeleted: boolean;
  deletedAt: Date;
  isRead: boolean;
  readAt?: Date;
  messageStatus: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  updatedAt: Date;
}
