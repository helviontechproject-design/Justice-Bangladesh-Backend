import { Document, Types } from 'mongoose';

export enum ServiceBookingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export interface IDocument {
  label: string;
  url: string;
  originalName: string;
}

export interface IServiceBooking extends Document {
  serviceId: Types.ObjectId;
  clientId: Types.ObjectId;
  trackingCode: string;
  amount: number;
  status: ServiceBookingStatus;
  paymentStatus: 'unpaid' | 'paid';
  transactionId?: string;
  applicantName: string;
  applicantPhone: string;
  documents: IDocument[];
  rejectReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
