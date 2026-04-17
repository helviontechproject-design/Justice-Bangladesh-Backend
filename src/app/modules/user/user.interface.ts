import { Types } from 'mongoose';

export enum EIsActive {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export enum ERole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CLIENT = 'CLIENT',
  LAWYER = 'LAWYER',
}

export interface IUserBasicInfo {
  fast_name: string;
  last_name: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  gender?: string;
}


export interface IAuthProvider {
  provider: string;
  providerId: string;
}

interface PhoneNo {
  value: string;
  isVerified: boolean
}

export interface IUser {
  _id?: Types.ObjectId;
  email: string;
  phoneNo?: PhoneNo;
  password?: string;
  profilePhoto?: string;
  date_of_birth?: string;
  isActive?: EIsActive;
  isOnline?: boolean;
  lastSeen?: Date;
  client?: Types.ObjectId;
  lawyer?: Types.ObjectId;
  role: ERole;
  isDeleted?: boolean;
  isVerified?: boolean;
  notifications: Types.ObjectId[];
  auths: IAuthProvider[];
  fcmTokens?: string[];
  otpCode?: string;
  otpExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}



