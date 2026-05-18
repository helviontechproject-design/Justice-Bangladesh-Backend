import { Schema, model } from 'mongoose';
import { IVideo } from './video.interface';

const videoSchema = new Schema<IVideo>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    youtubeLink: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Video = model<IVideo>('Video', videoSchema);
