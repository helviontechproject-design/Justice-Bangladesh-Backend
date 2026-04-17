import { Types } from 'mongoose';

export enum ERecipientType {
  ALL = 'ALL',
  LAWYERS = 'LAWYERS',
  CLIENTS = 'CLIENTS',
}

export interface IBroadcastNotification {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  imageUrl?: string;
  recipientType: ERecipientType;
  deliveryCount: number;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
