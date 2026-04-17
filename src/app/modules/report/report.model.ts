import { Schema, model } from 'mongoose';
import { IReport } from './report.interface';

const reportSchema = new Schema<IReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userRole: { type: String, enum: ['CLIENT', 'LAWYER'], required: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
    adminReply: { type: String, default: '' },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

export const Report = model<IReport>('Report', reportSchema);
