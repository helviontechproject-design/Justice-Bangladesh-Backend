import { Types } from 'mongoose';

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface IPayout {
  _id?: Types.ObjectId;
  lawyerId: Types.ObjectId;
  amount: number; // Amount lawyer requested
  platformFee: number; // Platform fee deducted
  netAmount: number; // Amount lawyer will receive (amount - platformFee)
  currency: string;
  status: PayoutStatus;
  providerPayoutId?: string | null;
  paymentMethod?: string | null;
  accountDetails?: any;
  failureReason?: string | null;
  requestedAt: Date;
  processedAt?: Date | null;
  bookingIds: Types.ObjectId[];
  createdAt: string;
  updatedAt: string;
}
