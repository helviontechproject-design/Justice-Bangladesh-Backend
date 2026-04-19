import { model, Schema, Types } from 'mongoose';
import { EIsActive, ERole, IAuthProvider, IUser } from './user.interface';

const AuthProviderSchema = new Schema<IAuthProvider>(
  {
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: false, unique: true, sparse: true, trim: true },
    phoneNo: {
      type: new Schema({
        value: {
          type: String,
          unique: true,
          sparse: true,
          trim: true,
        },
        isVerified: {
          type: Boolean,
          default: false,
        },
      }, { _id: false }),
      default: undefined,
    },
    password: { type: String },
    profilePhoto: { type: String },
    date_of_birth: { type: String },
    isActive: {
      type: String,
      enum: Object.values(EIsActive),
      default: EIsActive.ACTIVE,
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: new Date() },
    client: { type: Types.ObjectId, ref: 'ClientProfile' },
    lawyer: { type: Types.ObjectId, ref: 'LawyerProfile' },
    role: {
      type: String,
      enum: Object.values(ERole),
      default: ERole.CLIENT,
    },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    notifications: [{ type: Types.ObjectId, ref: 'Notification' }],
    auths: { type: [AuthProviderSchema], default: [] },
    fcmTokens: { type: [String], default: [] },
    otpCode: { type: String },
    otpExpiry: { type: Date },
  },
  {
    timestamps: true,
  }
);

// ===== Model =====
export const UserModel = model<IUser>('User', UserSchema);
