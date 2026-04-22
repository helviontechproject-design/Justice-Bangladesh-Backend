import { Types } from "mongoose";
import { EGender } from "../lawyer/lawyer.interface";




export interface profileDetails {
  fast_name: string;
  last_name: string;
  email: string;
  phone: string;
  photo: string;
  paypal_Email: string;
  street_address: string;
  district: string;
}






export interface IClientProfile {
  _id: string;
  userId: Types.ObjectId;
  profileInfo: profileDetails;
  address: string;
  gender: EGender;
  savedLawyers: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}