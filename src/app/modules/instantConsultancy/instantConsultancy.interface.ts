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

export interface IInstantConsultancySettings extends Document {
  fee: number;
  durationMinutes: number;
  isEnabled: boolean;
}

export interface IInstantConsultancyItem extends Document {
  name: string;
  categoryId: Types.ObjectId;
  fee: number;
  imageUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInstantConsultancy extends Document {
  clientId: Types.ObjectId;
  lawyerId?: Types.ObjectId;
  categoryId: Types.ObjectId;
  appointmentType: 'Audio Call' | 'Video Call';
  note?: string;
  documents?: string[];
  channelName?: string;
  status: InstantConsultancyStatus;
  fee: number;
  paymentStatus: 'pending' | 'paid';
  bkashPaymentID?: string;
  bkashTrxID?: string;
  createdAt: Date;
  updatedAt: Date;
}
