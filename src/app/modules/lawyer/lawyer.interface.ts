import { Types } from "mongoose";

export interface profileDetails {
  fast_name: string;
  last_name: string;
  email: string;
  phone: string;
  national_Country: string;
  paypal_Email: string;
  street_address: string;
  district: string;
  police_station: string;
}

export interface lawyerDetails {
  bar_no: string;
  license_no: string;
  yearsOfExperience: number;
  chamber_name: string;
  practice_area: string;
  court_districts: { district: string; court: string }[];
  bar_council_certificate: string;
  about_lawyer: string;
}

export interface Chamber {
  name: string;
  location: string;
}

export interface Qualification {
  degree: string;
  institution: string;
  year: string;
}

export interface CallFeeSlot {
  minutes: number;
  fee: number;
}

export interface contactInfo {
  contactNumber: string;
  lawyerNumber: string;
  address: string;
  currentWorkingPlace: string;
  location: string;
}

export enum EGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export interface WorkExperience {
  title: string;
  designation: string;
  specialized_type: string;
  starting_date: string;
  end_date: string;
  about_lawyer: string;
}

export interface ILawyerProfile {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  profile_Details?: profileDetails;
  lawyerDetails?: lawyerDetails;
  contactInfo?: contactInfo;
  gender?: EGender;
  quialification?: string;
  designation?: string;
  per_consultation_fee?: number;
  educations: string[];
  qualifications?: Qualification[];
  walletId?: Types.ObjectId;
  availability?: Types.ObjectId[];
  work_experience?: WorkExperience[];
  specialties?: Types.ObjectId[];
  categories?: Types.ObjectId[];
  services?: Types.ObjectId[];
  reviews?: Types.ObjectId[];
  avarage_rating?: number;
  appointments_Count?: number;
  chambers?: Chamber[];
  chambers_Count?: number;
  favorite_count?: number;
  totalReviews?: number;
  views: number;
  isSpecial?: boolean;
  isPopular?: boolean;
  isOnline?: boolean;
  inPerson?: boolean;
  videoConsult?: boolean;
  audioCall?: boolean;
  call_fees?: CallFeeSlot[];
  video_fees?: CallFeeSlot[];
  chamber_fee?: number;
  chamber_duration?: number;
  payoutMethod?: {
    type: 'Bank' | 'bKash' | 'Nagad';
    bankName?: string;
    branchName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    bkashNumber?: string;
    nagadNumber?: string;
  };
  withdrawals?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}