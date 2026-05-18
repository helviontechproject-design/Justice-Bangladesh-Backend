import { Document } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  description: string;
  youtubeLink: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
