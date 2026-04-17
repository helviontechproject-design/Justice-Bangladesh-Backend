import { Document, Types } from 'mongoose';

export interface IClientReview extends Document {
  clientId: Types.ObjectId;
  lawyerId?: Types.ObjectId;
  serviceId?: Types.ObjectId;
  rating: number;
  comment?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}
