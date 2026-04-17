import { Schema, model } from 'mongoose';
import { IPayment, PaymentStatus, PaymentType } from './payment.interface';

const paymentSchema = new Schema<IPayment>(
  {
    lawyerId: {
      type: Schema.Types.ObjectId,
      ref: 'LawyerProfile',
      required: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientProfile',
      required: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    paymentGatewayData: {
      type: String,
    },
    invoiceUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Payment = model<IPayment>(
  'Payment',
  paymentSchema
);
