import { Document, Types } from 'mongoose';

export enum InstantConsultancyStatus {
  WAITING = 'waiting',       // client waiting for lawyer
  ACCEPTED = 'accepted',     // lawyer accepted
  ONGOING = 'ongoing',       // call in progress
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',       // no lawyer accepted within timeout
}

export interface IInstantConsultancy extends Document {
  clientId: Types.ObjectId;
  lawyerId?: Types.ObjectId;
  categoryId: Types.ObjectId;
  callType: 'audio' | 'video';
  note?: string;
  channelName?: string;
  status: InstantConsultancyStatus;
  createdAt: Date;
  updatedAt: Date;
}
