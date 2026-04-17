import { Schema, model } from 'mongoose';
import { IInstantConsultancy, InstantConsultancyStatus, INSTANT_CONSULTATION_FEE } from './instantConsultancy.interface';

const instantConsultancySchema = new Schema<IInstantConsultancy>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'ClientProfile', required: true },
    lawyerId: { type: Schema.Types.ObjectId, ref: 'LawyerProfile', default: null },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    callType: { type: String, enum: ['audio'], default: 'audio' },
    note: { type: String, trim: true },
    channelName: { type: String },
    status: {
      type: String,
      enum: Object.values(InstantConsultancyStatus),
      default: InstantConsultancyStatus.WAITING,
    },
    fee: { type: Number, default: INSTANT_CONSULTATION_FEE },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    bkashPaymentID: { type: String },
  },
  { timestamps: true }
);

export const InstantConsultancyModel = model<IInstantConsultancy>(
  'InstantConsultancy',
  instantConsultancySchema
);
