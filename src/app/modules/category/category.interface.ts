import { Document } from 'mongoose';


export interface ICategory extends Document {
  name: string;
  slug: string;
  imageUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  consultationFee: number;
  createdAt: Date;
  updatedAt: Date;
}
