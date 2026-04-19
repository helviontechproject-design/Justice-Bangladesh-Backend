import { Document, Types } from 'mongoose';

export enum AppointmentType {
  AUDIO = 'audio',
  VIDEO = 'video',
  IN_PERSON = 'in-person',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum AppointmentPaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  REJECT = 'REJECT',
}

export interface IAppointment extends Document {
  clientId: Types.ObjectId;
  lawyerId: Types.ObjectId;
  paymentId: Types.ObjectId;
  videoCallingId: string;
  videoCallingTime?: number;
  appointmentDate: Date;
  appointmentType: AppointmentType;
  selectedTime: string;
  caseType: string;
  note?: string;
  documents: string[];
  status: AppointmentStatus;
  payment_Status: AppointmentPaymentStatus;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: Date;
  totalFee?: number;
  createdAt: Date;
  updatedAt: Date;
}
