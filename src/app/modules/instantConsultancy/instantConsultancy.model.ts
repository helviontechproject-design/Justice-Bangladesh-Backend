import { Schema, model } from 'mongoose';
import { IInstantConsultancy, InstantConsultancyStatus } from './instantConsultancy.interface';

const instantConsultancySchema = new Schema<IInstantConsultancy>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'ClientProfile', required: true },
    lawyerId: { type: Schema.Types.ObjectId, ref: 'LawyerProfile', default: null },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    callType: { type: String, enum: ['audio', 'video'], default: 'audio' },
    note: { type: String, trim: true },
    channelName: { type: String },
    status: {
      type: String,
      enum: Object.values(InstantConsultancyStatus),
      default: InstantConsultancyStatus.WAITING,
    },
  },
  { timestamps: true }
);

export const InstantConsultancyModel = model<IInstantConsultancy>(
  'InstantConsultancy',
  instantConsultancySchema
);
