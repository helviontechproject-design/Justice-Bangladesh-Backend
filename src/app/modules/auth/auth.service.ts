/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { EIsActive, ERole, IUserBasicInfo } from "../user/user.interface";
import mongoose from "mongoose";
import { UserModel } from "../user/user.model";
import { LawyerProfileModel } from "../lawyer/lawyer.model";
import axios from "axios";
import { envVars } from "../../config/env";
import { admin } from "../../config/firebase";
import {
  createAccessTokenWithRefresh,
  createUserTokens,
} from "../../utils/createTokens";
import { ClientProfileModel } from "../client/client.model";
import { JwtPayload } from "jsonwebtoken";
import { WalletModel } from "../wallet/wallet.model";
import { NotificationHelper } from "../notification/notification.helper";

const OTP_ENABLED = true;
const OTP_EXPIRY_MINUTES = 5;
const TEST_OTP = '5805';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const normalizePhone = (phone?: string) => {
  if (!phone) return '';
  let value = phone.toString().trim();
  if (value.startsWith('+')) {
    value = '+' + value.slice(1).replace(/\D/g, '');
  } else {
    value = value.replace(/\D/g, '');
    if (!value.startsWith('88')) {
      value = `88${value}`;
    }
    value = `+${value}`;
  }
  return value;
};

// Skip WhatsApp in dev — just save OTP to DB silently
const sendWhatsAppOTP = async (phone: string, otp: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] OTP for ${phone}: ${otp} (test code: ${TEST_OTP})`);
    return;
  }
  if (!envVars.META_WHATSAPP.ACCESS_TOKEN || !envVars.META_WHATSAPP.PHONE_NUMBER_ID) {
    console.warn(`[OTP] WhatsApp not configured. OTP for ${phone}: ${otp}`);
    return;
  }
  const formattedPhone = phone.startsWith('+') ? phone : `+88${phone}`;
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${envVars.META_WHATSAPP.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: `আপনার Justice Bangladesh যাচাইকরণ কোড: *${otp}*\n\nএই কোডটি ${OTP_EXPIRY_MINUTES} মিনিটের মধ্যে মেয়াদ শেষ হবে। কাউকে শেয়ার করবেন না।`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${envVars.META_WHATSAPP.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (err) {
    console.error(`[OTP] WhatsApp send failed for ${phone}:`, err);
  }
};

export const createLawyerAccount = async (payload: Partial<IUserBasicInfo>) => {
  const phone = normalizePhone(payload.phone);
  if (!phone) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Phone Number Not Found!");
  }
  const isPhoneExist = await UserModel.findOne({
    'phoneNo.value': phone,
  });
  if (isPhoneExist) {
    if (isPhoneExist.role === ERole.CLIENT) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'This number is already registered as a Client account. One number can only have one account.',
      );
    }
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Phone Number already exists! Please use a different number.',
    );
  }

  const isEmailExist = await UserModel.findOne({
    email: payload.email,
  });

  if (isEmailExist) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Email already exists! Please use a different Email.",
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await UserModel.create(
      [
        {
          email: payload.email,
          phoneNo: {
            value: phone,
          },
          role: ERole.LAWYER,
          isVerified: !OTP_ENABLED,
          isActive: EIsActive.INACTIVE,
        },
      ],
      { session },
    );

    const userId = user[0]._id;

    const lawyerProfile = await LawyerProfileModel.create(
      [
        {
          userId,
          profile_Details: {
            fast_name: payload.fast_name || '',
            last_name: payload.last_name || '',
            email: payload.email || '',
            phone,
            paypal_Email: (payload as any).profile_Details?.paypal_Email || '',
            street_address: (payload as any).profile_Details?.street_address || '',
            district: (payload as any).profile_Details?.district || '',
            police_station: (payload as any).profile_Details?.police_station || '',
            national_Country: (payload as any).profile_Details?.national_Country || '',
          },
          lawyerDetails: (payload as any).lawyerDetails || {},
          gender: (payload as any).gender || 'MALE',
          quialification: (payload as any).quialification || '',
          designation: (payload as any).designation || '',
          per_consultation_fee: (payload as any).per_consultation_fee || 500,
          isPopular: (payload as any).isPopular || false,
          isSpecial: (payload as any).isSpecial || false,
          videoConsult: (payload as any).videoConsult || false,
          audioCall: (payload as any).audioCall || false,
          inPerson: (payload as any).inPerson || false,
        },
      ],
      { session },
    );

    const lawyerId = lawyerProfile[0]._id;

    const wallet = await WalletModel.create(
      [
        {
          lawyerId,
        },
      ],
      { session },
    );

    const walletId = wallet[0]._id;

    await LawyerProfileModel.findByIdAndUpdate(
      lawyerId,
      {
        walletId: walletId,
      },
      { new: true, session },
    );

    await UserModel.findByIdAndUpdate(
      userId,
      { lawyer: lawyerId },
      { new: true, session },
    );

    // Send WhatsApp OTP
    if (OTP_ENABLED) {
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      await UserModel.findByIdAndUpdate(userId, { otpCode: otp, otpExpiry }, { session });
      await session.commitTransaction();
      session.endSession();
      await sendWhatsAppOTP(phone, otp);
    } else {
      await session.commitTransaction();
      session.endSession();
    }

    return {
      success: true,
      message: OTP_ENABLED
        ? 'Lawyer account created successfully. Verification code sent via WhatsApp!'
        : 'Lawyer account created successfully.',
      data: { userId, lawyerId },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `${error}`);
  }
};

export const createClientAccount = async (payload: Partial<IUserBasicInfo>) => {
  const phone = normalizePhone(payload.phone);
  if (!phone) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Phone Number Not Found!");
  }

  const isPhoneExist = await UserModel.findOne({
    "phoneNo.value": phone,
  });

  if (isPhoneExist) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Phone Number already exists! Please use a different number.",
    );
  }

  const isEmailExist = await UserModel.findOne({
    email: payload.email,
  });

  if (isEmailExist) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Email already exists! Please use a different Email.",
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await UserModel.create(
      [
        {
          email: payload.email,
          phoneNo: {
            value: phone,
          },
          role: ERole.CLIENT,
          // OTP disabled temporarily for development — mark verified immediately
          isVerified: !OTP_ENABLED,
          isActive: "ACTIVE",
        },
      ],
      { session },
    );

    const userId = user[0]._id;

    const ClientProfile = await ClientProfileModel.create(
      [
        {
          userId,
          profileInfo: {
            fast_name: payload.fast_name || "",
            last_name: payload.last_name || "",
            email: payload.email || "",
            phone,
            paypal_Email: "",
            street_address: "",
            district: "",
          },
          gender: "MALE",
        },
      ],
      { session },
    );

    const clientId = ClientProfile[0]._id;

    await UserModel.findByIdAndUpdate(
      userId,
      { client: clientId },
      { new: true, session },
    );

    // Send WhatsApp OTP
    if (OTP_ENABLED) {
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      await UserModel.findByIdAndUpdate(userId, { otpCode: otp, otpExpiry }, { session });
      await session.commitTransaction();
      session.endSession();
      await sendWhatsAppOTP(phone, otp);
    } else {
      await session.commitTransaction();
      session.endSession();
    }

    return {
      success: true,
      message: OTP_ENABLED
        ? 'Client account created successfully. Verification code sent via WhatsApp!'
        : 'Client account created successfully.',
      data: { userId, clientId },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `${error}`);
  }
};

export const verifyOTP = async (payload: { phone: string; otp?: string }) => {
  const phone = normalizePhone(payload.phone);
  if (!phone) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Phone Number Missing");
  }

  const user = await UserModel.findOne({ "phoneNo.value": phone });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User Not Found");
  }

  // Check OTP expiry & match only when OTP is enabled
  if (OTP_ENABLED) {
    // TEST_OTP always works in any environment for development
    if (payload.otp !== TEST_OTP) {
      if (!user.otpExpiry || new Date() > user.otpExpiry) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'OTP has expired. Please request a new one.');
      }
      if (user.otpCode !== payload.otp) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid OTP. Please try again.');
      }
    }
  }

  if (user.phoneNo) {
    const wasNotVerified = !user.isVerified;
    user.isVerified = true;
    user.phoneNo.isVerified = true;
    user.isActive = EIsActive.ACTIVE;
    user.isOnline = true;
    user.lastSeen = new Date();
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Send account verified notification only on first verification
    if (wasNotVerified) {
      try {
        const userName = user.email || user.phoneNo.value || "User";
        await NotificationHelper.notifyAccountVerified(user._id, userName);
      } catch (error) {
        console.error("Error sending account verified notification:", error);
      }
    }
  }

  if (user.lawyer) {
    const lawyer = await LawyerProfileModel.findById(user.lawyer);
    if (lawyer) {
      lawyer.isOnline = true;
      await lawyer.save();
    }
  }

  const tokens = createUserTokens(user);
  return {
    ...user.toObject(),
    client: user.client,
    lawyer: user.lawyer,
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  };
  // } else {
  //   throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid or expired OTP');
  // }
};

export const userLogin = async (payload: { phone: string }) => {
  const phone = normalizePhone(payload.phone);
  if (!phone) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Phone Number Not Found');
  }

  let user = await UserModel.findOne({ 'phoneNo.value': phone });

  // Deleted user — treat as new user
  if (user?.isDeleted) {
    await UserModel.findByIdAndDelete(user._id);
    user = null;
  }

  // Auto-create client account if not exists
  if (!user) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const created = await UserModel.create([{
        phoneNo: { value: phone },
        role: ERole.CLIENT,
        isVerified: !OTP_ENABLED,
        isActive: EIsActive.ACTIVE,
      }], { session });
      const userId = created[0]._id;
      const clientProfile = await ClientProfileModel.create([{
        userId,
        profileInfo: { phone },
        gender: 'MALE',
      }], { session });
      await UserModel.findByIdAndUpdate(userId,
        { client: clientProfile[0]._id }, { session });
      await session.commitTransaction();
      session.endSession();
      user = await UserModel.findById(userId);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `${err}`);
    }
  }

  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User Not Found');

  // Lawyer pending approval check
  if (user.role === ERole.LAWYER && user.isActive === EIsActive.INACTIVE) {
    throw new AppError(StatusCodes.FORBIDDEN, 'PENDING_APPROVAL');
  }

  if (user.isActive === EIsActive.BLOCKED) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Your account has been blocked.');
  }

  // Send WhatsApp OTP for login
  if (OTP_ENABLED) {
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await UserModel.findByIdAndUpdate(user._id, { otpCode: otp, otpExpiry });
    await sendWhatsAppOTP(phone, otp);
    return {
      message: 'Verification code sent via WhatsApp!',
      role: user.role,
      userId: user._id,
    };
  }

  const tokens = createUserTokens(user);
  return {
    message: 'Login successful.',
    role: user.role,
    userId: user._id,
    client: user.client,
    lawyer: user.lawyer,
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  };
};

export const resendOTP = async (payload: { phone: string }) => {
  const phone = normalizePhone(payload.phone);
  if (!phone) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Phone Number Missing");
  }

  const user = await UserModel.findOne({ "phoneNo.value": phone });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User Not Found");
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await UserModel.findByIdAndUpdate(user._id, { otpCode: otp, otpExpiry });
  await sendWhatsAppOTP(phone, otp);

  return {
    success: true,
    message: "New verification code sent via WhatsApp!",
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(StatusCodes.NOT_FOUND, "no RefreshToken Received");
  }

  const accessToken = await createAccessTokenWithRefresh(refreshToken);
  return {
    accessToken: accessToken,
  };
};

export const addPhoneNo = async (
  decodedUser: JwtPayload,
  payload: { phone: number },
) => {
  //  User check
  const user = await UserModel.findById(decodedUser?.userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  //  Update user phone and status
  user.phoneNo = {
    value: normalizePhone(payload.phone?.toString()),
    isVerified: false,
  };
  user.isActive = EIsActive.INACTIVE;
  await user.save();

  if (OTP_ENABLED) {
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await UserModel.findByIdAndUpdate(user._id, { otpCode: otp, otpExpiry });
    await sendWhatsAppOTP(normalizePhone(payload.phone?.toString()), otp);
  }

  return {
    success: true,
    message: OTP_ENABLED
      ? 'OTP sent successfully via WhatsApp!'
      : 'Phone number updated successfully.',
  };
};

export const adminLogin = async (payload: { email: string; password: string }) => {
  if (!payload.email || !payload.password) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Email and password are required');
  }

  const user = await UserModel.findOne({ email: payload.email });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Admin not found');
  }

  if (user.role !== ERole.SUPER_ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Access denied. Super Admin only.');
  }

  // Check password — supports runtime update via updateAdminCredentials
  const currentPassword = process.env.ADMIN_PASSWORD || envVars.ADMIN_PASSWORD;
  if (payload.password !== currentPassword) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid password');
  }

  const tokens = createUserTokens(user);
  return {
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
    },
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  };
};

// ── Firebase Phone Login ──────────────────────────────────────────────────────
// Called after Flutter verifies the OTP via Firebase Auth.
// We verify the Firebase ID token using Admin SDK, then find/create the user
// and return our own JWT tokens — same shape as the existing login response.
export const firebasePhoneLogin = async (payload: { idToken: string; phone: string }) => {
  if (!payload.idToken || !payload.phone) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'idToken and phone are required');
  }

  const phone = normalizePhone(payload.phone);
  if (!phone) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Phone Number Not Found');
  }

  // 1. Verify the Firebase ID token — throws if invalid/expired
  const decoded = await admin.auth().verifyIdToken(payload.idToken);
  if (!decoded.phone_number && !decoded.uid) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid Firebase token');
  }

  // 2. Find existing user by phone
  let user = await UserModel.findOne({ 'phoneNo.value': phone });

  // 3. Auto-create client if first login
  if (!user) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const created = await UserModel.create([{
        phoneNo: { value: phone, isVerified: true },
        role: ERole.CLIENT,
        isVerified: true,
        isActive: EIsActive.ACTIVE,
      }], { session });
      const userId = created[0]._id;
      const clientProfile = await ClientProfileModel.create([{
        userId,
        profileInfo: { phone },
        gender: 'MALE',
      }], { session });
      await UserModel.findByIdAndUpdate(userId, { client: clientProfile[0]._id }, { session });
      await session.commitTransaction();
      session.endSession();
      user = await UserModel.findById(userId);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `${err}`);
    }
  }

  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

  if (user.isActive === EIsActive.BLOCKED) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Your account has been blocked.');
  }

  if (user.role === ERole.LAWYER && user.isActive === EIsActive.INACTIVE) {
    throw new AppError(StatusCodes.FORBIDDEN, 'PENDING_APPROVAL');
  }

  // 4. Mark phone as verified (in case it wasn't already)
  if (user.phoneNo && !user.phoneNo.isVerified) {
    user.phoneNo.isVerified = true;
    user.isVerified = true;
    user.isActive = EIsActive.ACTIVE;
    await user.save();
  }

  // 5. Return JWT tokens
  const tokens = createUserTokens(user);
  return {
    role: user.role,
    userId: user._id,
    client: user.client,
    lawyer: user.lawyer,
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  };
};

export const updateAdminCredentials = async (
  userId: string,
  payload: { email?: string; password?: string; name?: string }
) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'Admin not found');
  if (user.role !== ERole.SUPER_ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Access denied');
  }

  if (payload.email) user.email = payload.email;
  if (payload.password) {
    // Store plain password in env-style — same as adminLogin check
    // For production use bcrypt, for now match existing pattern
    user.set('plainPassword', payload.password);
    // Update env var at runtime so adminLogin works immediately
    process.env.ADMIN_PASSWORD = payload.password;
  }
  if (payload.name) {
    user.set('name', payload.name);
  }

  await user.save();
  return { email: user.email };
};

export const authServices = {
  createLawyerAccount,
  createClientAccount,
  verifyOTP,
  resendOTP,
  userLogin,
  adminLogin,
  getNewAccessToken,
  addPhoneNo,
  googleMobileLogin,
  addPhoneForGoogleUser,
  firebasePhoneLogin,
  updateAdminCredentials,
};

async function googleMobileLogin(payload: { email: string; name?: string; photo?: string; googleId: string }) {
  // 1. Find by googleId first (most reliable)
  let user = await UserModel.findOne({ 'auths.providerId': payload.googleId });

  // 2. If not found by googleId, find by email
  if (!user) {
    user = await UserModel.findOne({ email: payload.email });
    // Link google to this existing account
    if (user) {
      const hasGoogle = user.auths?.some(a => a.provider === 'google');
      if (!hasGoogle) {
        await UserModel.findByIdAndUpdate(user._id, {
          $push: { auths: { provider: 'google', providerId: payload.googleId } },
          ...(payload.photo && !user.profilePhoto ? { profilePhoto: payload.photo } : {}),
        });
        user = await UserModel.findById(user._id);
      }
    }
  }

  if (!user) {
    // 3. Create new client account
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const created = await UserModel.create([{
        email: payload.email,
        profilePhoto: payload.photo,
        role: ERole.CLIENT,
        isVerified: true,
        isActive: EIsActive.ACTIVE,
        auths: [{ provider: 'google', providerId: payload.googleId }],
      }], { session });
      const userId = created[0]._id;
      const clientProfile = await ClientProfileModel.create([{
        userId,
        profileInfo: {
          fast_name: payload.name?.split(' ')[0] ?? '',
          last_name: payload.name?.split(' ').slice(1).join(' ') ?? '',
          email: payload.email,
        },
      }], { session });
      await UserModel.findByIdAndUpdate(userId, { client: clientProfile[0]._id }, { session });
      await session.commitTransaction();
      session.endSession();
      user = await UserModel.findById(userId);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `${err}`);
    }
  } else {
    // Update photo if not set
    if (payload.photo && !user.profilePhoto) {
      await UserModel.findByIdAndUpdate(user._id, { profilePhoto: payload.photo });
      user = await UserModel.findById(user._id);
    }
  }

  if (!user) throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create user');

  if (user.isActive === EIsActive.BLOCKED) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Your account has been blocked.');
  }

  const tokens = createUserTokens(user);
  const hasGoogleLinked = user.auths?.some(a => a.provider === 'google') ?? false;
  return {
    ...user.toObject(),
    googleLinked: hasGoogleLinked,
    tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
  };
}

async function addPhoneForGoogleUser(userId: string, phone: string) {
  // Check phone not already used
  const existing = await UserModel.findOne({ 'phoneNo.value': phone });
  if (existing && existing._id.toString() !== userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'This phone number is already registered.');
  }
  await UserModel.findByIdAndUpdate(userId, {
    phoneNo: { value: phone, isVerified: true },
  });
  return { success: true };
}
