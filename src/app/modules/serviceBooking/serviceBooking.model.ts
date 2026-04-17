import { Schema, model } from 'mongoose';
import { IServiceBooking, ServiceBookingStatus } from './serviceBooking.interface';

const documentSchema = new Schema({ label: String, url: String, originalName: String }, { _id: false });

const serviceBookingSchema = new Schema<IServiceBooking>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'ClientProfile', required: true },
    trackingCode: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(ServiceBookingStatus),
      default: ServiceBookingStatus.PENDING,
    },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    transactionId: { type: String, trim: true },
    applicantName: { type: String, required: true, trim: true },
    applicantPhone: { type: String, required: true, trim: true },
    documents: { type: [documentSchema], default: [] },
    rejectReason: { type: String, trim: true },
  },
  { timestamps: true }
);

export const ServiceBookingModel = model<IServiceBooking>('ServiceBooking', serviceBookingSchema);
