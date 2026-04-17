import { Document, Types } from 'mongoose';


export interface ILawyerSpecialty extends Document {
  title: string;
  icon: string;
  category: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
