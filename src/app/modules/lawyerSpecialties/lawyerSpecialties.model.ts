import { Schema, model, Types } from 'mongoose';
import { ILawyerSpecialty } from './lawyerSpecialties.interface';


const lawyerSpecialtySchema = new Schema<ILawyerSpecialty>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: false,
      trim: true,
    },
    category: {
      type: [Schema.Types.ObjectId],
      ref: 'Category', 
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

export const LawyerSpecialty = model<ILawyerSpecialty>(
  'LawyerSpecialty',
  lawyerSpecialtySchema
);
