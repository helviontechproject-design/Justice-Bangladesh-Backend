import { Types } from "mongoose";

export enum PaymentType {
  BOOKING_FEE = 'booking_fee',
  PAYOUT = 'payout',
  REFUND = 'refund',
  TOP_UP = 'top_up',
}


export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}


export interface IPayment extends Document {
  lawyerId: Types.ObjectId;
  clientId: Types.ObjectId;
  appointmentId: Types.ObjectId;
  transactionId: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  description?: string;
  paymentGatewayData: string;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
