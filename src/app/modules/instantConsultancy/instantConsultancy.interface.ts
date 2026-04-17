import { Document, Types } from 'mongoose';

export enum InstantConsultancyStatus {
  WAITING = 'waiting',
  ACCEPTED = 'accepted',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export const INSTANT_CONSULTATION_FEE = 500; // BDT

export interface IInstantConsultancy extends Document {
  clientId: Types.ObjectId;
  lawyerId?: Types.ObjectId;
  categoryId: Types.ObjectId;
  callType: 'audio';
  note?: string;
  channelName?: string;
  status: InstantConsultancyStatus;
  fee: number;
  paymentStatus: 'pending' | 'paid';
  bkashPaymentID?: string;
  createdAt: Date;
  updatedAt: Date;
}
