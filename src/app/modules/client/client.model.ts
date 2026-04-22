import { model, Schema } from "mongoose";
import { IClientProfile, profileDetails } from "./client.interface";
import { EGender } from "../lawyer/lawyer.interface";

const ProfileDetailsSchema = new Schema<profileDetails>(
  {
    fast_name: { type: String },
    last_name: { type: String },
    email: { type: String },
    phone: { type: String },
    photo: { type: String },
    paypal_Email: { type: String },
    street_address: { type: String },
    district: { type: String },
  },
  { _id: false }
);

// ===== Main Schema =====
const ClientProfileSchema = new Schema<IClientProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    profileInfo: { type: ProfileDetailsSchema },
    address: { type: String },
    gender: { type: String, enum: Object.values(EGender) },
    savedLawyers: [{ type: Schema.Types.ObjectId, ref: 'LawyerProfile' }],
  },
  {
    timestamps: true,
  }
);

// ===== Model =====
export const ClientProfileModel = model<IClientProfile>(
  'ClientProfile',
  ClientProfileSchema
);
