import { Schema, model } from 'mongoose';
import { IInstantConsultancy, IInstantConsultancyItem, IInstantConsultancySettings, InstantConsultancyStatus, INSTANT_CONSULTATION_FEE } from './instantConsultancy.interface';

const instantConsultancySchema = new Schema<IInstantConsultancy>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'ClientProfile', required: true },
    lawyerId: { type: Schema.Types.ObjectId, ref: 'LawyerProfile', default: null },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    appointmentType: { type: String, enum: ['Audio Call', 'Video Call'], default: 'Audio Call' },
    note: { type: String, trim: true },
    documents: [{ type: String }],
    channelName: { type: String },
    status: {
      type: String,
      enum: Object.values(InstantConsultancyStatus),
      default: InstantConsultancyStatus.WAITING,
    },
    fee: { type: Number, default: INSTANT_CONSULTATION_FEE },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    bkashPaymentID: { type: String },
    bkashTrxID: { type: String },
  },
  { timestamps: true }
);

const instantConsultancySettingsSchema = new Schema<IInstantConsultancySettings>(
  {
    fee: { type: Number, default: INSTANT_CONSULTATION_FEE },
    durationMinutes: { type: Number, default: 10 },
    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const InstantConsultancyModel = model<IInstantConsultancy>(
  'InstantConsultancy',
  instantConsultancySchema
);

export const InstantConsultancySettingsModel = model<IInstantConsultancySettings>(
  'InstantConsultancySettings',
  instantConsultancySettingsSchema
);

const instantConsultancyItemSchema = new Schema<IInstantConsultancyItem>(
  {
    name: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    fee: { type: Number, required: true },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const InstantConsultancyItemModel = model<IInstantConsultancyItem>(
  'InstantConsultancyItem',
  instantConsultancyItemSchema
);
