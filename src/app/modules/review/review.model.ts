import { Schema, model, Types } from 'mongoose';
import { IClientReview } from './review.interface';


const clientReviewSchema = new Schema<IClientReview>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientProfile',
      required: false,
    },
    lawyerId: {
      type: Schema.Types.ObjectId,
      ref: 'LawyerProfile',
      required: false,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: false,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


export const ClientReview = model<IClientReview>(
  'ClientReview',
  clientReviewSchema
);
