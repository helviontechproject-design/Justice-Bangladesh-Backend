import { Schema, model } from 'mongoose';
import { IBanner } from './banner.interface';

const bannerSchema = new Schema<IBanner>(
  {
    ImageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    target: {
      type: String,
      enum: ['client', 'lawyer', 'all'],
      default: 'all',
    },
  },
  {
    timestamps: true,
  }
);

export const Banner = model<IBanner>('Banner', bannerSchema);
