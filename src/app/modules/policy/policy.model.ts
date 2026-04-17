import { Schema, model } from 'mongoose';
import { IPolicy } from './policy.interface';

const policySchema = new Schema<IPolicy>(
  {
    type: { type: String, enum: ['terms', 'privacy', 'payment', 'refund', 'about'], required: true },
    role: { type: String, enum: ['CLIENT', 'LAWYER'], required: true },
    content: { type: String, required: true, default: '' },
  },
  { timestamps: true }
);

policySchema.index({ type: 1, role: 1 }, { unique: true });

export const Policy = model<IPolicy>('Policy', policySchema);
