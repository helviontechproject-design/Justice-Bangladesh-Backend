import { Document } from 'mongoose';


export interface ICategory extends Document {
  name: string;
  slug: string; 
  imageUrl?: string; 
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
