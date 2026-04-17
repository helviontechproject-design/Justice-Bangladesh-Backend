import { Document } from 'mongoose';


export interface IService extends Document {
  name: string;
  slug: string;
  description?: string;
  price: number;
  iconUrl?: string;
  imageUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
