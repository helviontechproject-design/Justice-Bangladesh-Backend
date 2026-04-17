import { Schema, model } from 'mongoose';
import { IFaq } from './faq.interface';

const faqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    role: { type: String, enum: ['CLIENT', 'LAWYER'], required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Faq = model<IFaq>('Faq', faqSchema);
