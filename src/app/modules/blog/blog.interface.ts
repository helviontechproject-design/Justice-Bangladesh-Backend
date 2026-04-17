import { Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  category: string;
  imageUrl: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
