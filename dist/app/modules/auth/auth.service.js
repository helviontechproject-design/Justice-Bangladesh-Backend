"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authServices = exports.updateAdminCredentials = exports.firebasePhoneLogin = exports.adminLogin = exports.addPhoneNo = exports.resendOTP = exports.userLogin = exports.verifyOTP = exports.createClientAccount = exports.createLawyerAccount = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_interface_1 = require("../user/user.interface");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../user/user.model");
const lawyer_model_1 = require("../lawyer/lawyer.model");
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const firebase_1 = require("../../config/firebase");
const createTokens_1 = require("../../utils/createTokens");
const client_model_1 = require("../client/client.model");
const wallet_model_1 = require("../wallet/wallet.model");
const notification_helper_1 = require("../notification/notification.helper");
const OTP_ENABLED = true;
const OTP_EXPIRY_MINUTES = 5;
const TEST_OTP = '5805';
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
// Skip WhatsApp in dev — just save OTP to DB silently
const sendWhatsAppOTP = (phone, otp) => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] OTP for ${phone}: ${otp} (test code: ${TEST_OTP})`);
        return;
    }
    const formattedPhone = phone.startsWith('+') ? phone : `+88${phone}`;
    yield axios_1.default.post(`https://graph.facebook.com/v19.0/${env_1.envVars.META_WHATSAPP.PHONE_NUMBER_ID}/messages`, {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
            body: `আপনার Justice Bangladesh যাচাইকরণ কোড: *${otp}*\n\nএই কোডটি ${OTP_EXPIRY_MINUTES} মিনিটের মধ্যে মেয়াদ শেষ হবে। কাউকে শেয়ার করবেন না।`,
        },
    }, {
        headers: {
            Authorization: `Bearer ${env_1.envVars.META_WHATSAPP.ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });
});
const createLawyerAccount = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    if (!payload.phone) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Phone Number Not Found!");
    }
    const isPhoneExist = yield user_model_1.UserModel.findOne({
        'phoneNo.value': payload.phone,
    });
    if (isPhoneExist) {
        if (isPhoneExist.role === user_interface_1.ERole.CLIENT) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This number is already registered as a Client account. One number can only have one account.');
        }
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Phone Number already exists! Please use a different number.');
    }
    const isEmailExist = yield user_model_1.UserModel.findOne({
        email: payload.email,
    });
    if (isEmailExist) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email already exists! Please use a different Email.");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const user = yield user_model_1.UserModel.create([
            {
                email: payload.email,
                phoneNo: {
                    value: payload.phone,
                },
                role: user_interface_1.ERole.LAWYER,
                isVerified: !OTP_ENABLED,
                isActive: user_interface_1.EIsActive.INACTIVE,
            },
        ], { session });
        const userId = user[0]._id;
        const lawyerProfile = yield lawyer_model_1.LawyerProfileModel.create([
            {
                userId,
                profile_Details: {
                    fast_name: payload.fast_name || '',
                    last_name: payload.last_name || '',
                    email: payload.email || '',
                    phone: payload.phone || '',
                    paypal_Email: ((_a = payload.profile_Details) === null || _a === void 0 ? void 0 : _a.paypal_Email) || '',
                    street_address: ((_b = payload.profile_Details) === null || _b === void 0 ? void 0 : _b.street_address) || '',
                    district: ((_c = payload.profile_Details) === null || _c === void 0 ? void 0 : _c.district) || '',
                    police_station: ((_d = payload.profile_Details) === null || _d === void 0 ? void 0 : _d.police_station) || '',
                    national_Country: ((_e = payload.profile_Details) === null || _e === void 0 ? void 0 : _e.national_Country) || '',
                },
                lawyerDetails: payload.lawyerDetails || {},
                gender: payload.gender || 'MALE',
                quialification: payload.quialification || '',
                designation: payload.designation || '',
                per_consultation_fee: payload.per_consultation_fee || 500,
                isPopular: payload.isPopular || false,
                isSpecial: payload.isSpecial || false,
                videoConsult: payload.videoConsult || false,
                audioCall: payload.audioCall || false,
                inPerson: payload.inPerson || false,
            },
        ], { session });
        const lawyerId = lawyerProfile[0]._id;
        const wallet = yield wallet_model_1.WalletModel.create([
            {
                lawyerId,
            },
        ], { session });
        const walletId = wallet[0]._id;
        yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, {
            walletId: walletId,
        }, { new: true, session });
        yield user_model_1.UserModel.findByIdAndUpdate(userId, { lawyer: lawyerId }, { new: true, session });
        // Send WhatsApp OTP
        if (OTP_ENABLED) {
            const otp = generateOTP();
            const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
            yield user_model_1.UserModel.findByIdAndUpdate(userId, { otpCode: otp, otpExpiry }, { session });
            yield session.commitTransaction();
            session.endSession();
            yield sendWhatsAppOTP(payload.phone, otp);
        }
        else {
            yield session.commitTransaction();
            session.endSession();
        }
        return {
            success: true,
            message: OTP_ENABLED
                ? 'Lawyer account created successfully. Verification code sent via WhatsApp!'
                : 'Lawyer account created successfully.',
            data: { userId, lawyerId },
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `${error}`);
    }
});
exports.createLawyerAccount = createLawyerAccount;
const createClientAccount = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload.phone) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Phone Number Not Found!");
    }
    const isPhoneExist = yield user_model_1.UserModel.findOne({
        "phoneNo.value": payload.phone,
    });
    if (isPhoneExist) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Phone Number already exists! Please use a different number.");
    }
    const isEmailExist = yield user_model_1.UserModel.findOne({
        email: payload.email,
    });
    if (isEmailExist) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email already exists! Please use a different Email.");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const user = yield user_model_1.UserModel.create([
            {
                email: payload.email,
                phoneNo: {
                    value: payload.phone,
                },
                role: user_interface_1.ERole.CLIENT,
                // OTP disabled temporarily for development — mark verified immediately
                isVerified: !OTP_ENABLED,
                isActive: "ACTIVE",
            },
        ], { session });
        const userId = user[0]._id;
        const ClientProfile = yield client_model_1.ClientProfileModel.create([
            {
                userId,
                profileInfo: {
                    fast_name: payload.fast_name || "",
                    last_name: payload.last_name || "",
                    email: payload.email || "",
                    phone: payload.phone || "",
                    paypal_Email: "",
                    street_address: "",
                    district: "",
                },
                gender: "MALE",
            },
        ], { session });
        const clientId = ClientProfile[0]._id;
        yield user_model_1.UserModel.findByIdAndUpdate(userId, { client: clientId }, { new: true, session });
        // Send WhatsApp OTP
        if (OTP_ENABLED) {
            const otp = generateOTP();
            const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
            yield user_model_1.UserModel.findByIdAndUpdate(userId, { otpCode: otp, otpExpiry }, { session });
            yield session.commitTransaction();
            session.endSession();
            yield sendWhatsAppOTP(payload.phone, otp);
        }
        else {
            yield session.commitTransaction();
            session.endSession();
        }
        return {
            success: true,
            message: OTP_ENABLED
                ? 'Client account created successfully. Verification code sent via WhatsApp!'
                : 'Client account created successfully.',
            data: { userId, clientId },
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `${error}`);
    }
});
exports.createClientAccount = createClientAccount;
const verifyOTP = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload.phone) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Phone Number Missing");
    }
    const user = yield user_model_1.UserModel.findOne({ "phoneNo.value": payload.phone });
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found");
    }
    // Check OTP expiry & match only when OTP is enabled
    if (OTP_ENABLED) {
        // TEST_OTP always works in any environment for development
        if (payload.otp !== TEST_OTP) {
            if (!user.otpExpiry || new Date() > user.otpExpiry) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'OTP has expired. Please request a new one.');
            }
            if (user.otpCode !== payload.otp) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid OTP. Please try again.');
            }
        }
    }
    if (user.phoneNo) {
        const wasNotVerified = !user.isVerified;
        user.isVerified = true;
        user.phoneNo.isVerified = true;
        user.isActive = user_interface_1.EIsActive.ACTIVE;
        user.isOnline = true;
        user.lastSeen = new Date();
        user.otpCode = undefined;
        user.otpExpiry = undefined;
        yield user.save();
        // Send account verified notification only on first verification
        if (wasNotVerified) {
            try {
                const userName = user.email || user.phoneNo.value || "User";
                yield notification_helper_1.NotificationHelper.notifyAccountVerified(user._id, userName);
            }
            catch (error) {
                console.error("Error sending account verified notification:", error);
            }
        }
    }
    if (user.lawyer) {
        const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(user.lawyer);
        if (lawyer) {
            lawyer.isOnline = true;
            yield lawyer.save();
        }
    }
    const tokens = (0, createTokens_1.createUserTokens)(user);
    return Object.assign(Object.assign({}, user.toObject()), { tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        } });
    // } else {
    //   throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid or expired OTP');
    // }
});
exports.verifyOTP = verifyOTP;
const userLogin = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    let user = yield user_model_1.UserModel.findOne({ 'phoneNo.value': payload.phone });
    // Deleted user — treat as new user
    if (user === null || user === void 0 ? void 0 : user.isDeleted) {
        yield user_model_1.UserModel.findByIdAndDelete(user._id);
        user = null;
    }
    // Auto-create client account if not exists
    if (!user) {
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const created = yield user_model_1.UserModel.create([{
                    phoneNo: { value: payload.phone },
                    role: user_interface_1.ERole.CLIENT,
                    isVerified: !OTP_ENABLED,
                    isActive: user_interface_1.EIsActive.ACTIVE,
                }], { session });
            const userId = created[0]._id;
            const clientProfile = yield client_model_1.ClientProfileModel.create([{
                    userId,
                    profileInfo: { phone: payload.phone },
                    gender: 'MALE',
                }], { session });
            yield user_model_1.UserModel.findByIdAndUpdate(userId, { client: clientProfile[0]._id }, { session });
            yield session.commitTransaction();
            session.endSession();
            user = yield user_model_1.UserModel.findById(userId);
        }
        catch (err) {
            yield session.abortTransaction();
            session.endSession();
            throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `${err}`);
        }
    }
    if (!user)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User Not Found');
    // Lawyer pending approval check
    if (user.role === user_interface_1.ERole.LAWYER && user.isActive === user_interface_1.EIsActive.INACTIVE) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'PENDING_APPROVAL');
    }
    if (user.isActive === user_interface_1.EIsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Your account has been blocked.');
    }
    // Send WhatsApp OTP for login
    if (OTP_ENABLED) {
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        yield user_model_1.UserModel.findByIdAndUpdate(user._id, { otpCode: otp, otpExpiry });
        yield sendWhatsAppOTP(payload.phone, otp);
        return {
            message: 'Verification code sent via WhatsApp!',
            role: user.role,
            userId: user._id,
        };
    }
    const tokens = (0, createTokens_1.createUserTokens)(user);
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
});
exports.userLogin = userLogin;
const resendOTP = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload.phone) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Phone Number Missing");
    }
    const user = yield user_model_1.UserModel.findOne({ "phoneNo.value": payload.phone });
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found");
    }
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    yield user_model_1.UserModel.findByIdAndUpdate(user._id, { otpCode: otp, otpExpiry });
    yield sendWhatsAppOTP(payload.phone, otp);
    return {
        success: true,
        message: "New verification code sent via WhatsApp!",
    };
});
exports.resendOTP = resendOTP;
const getNewAccessToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (!refreshToken) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "no RefreshToken Received");
    }
    const accessToken = yield (0, createTokens_1.createAccessTokenWithRefresh)(refreshToken);
    return {
        accessToken: accessToken,
    };
});
const addPhoneNo = (decodedUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    //  User check
    const user = yield user_model_1.UserModel.findById(decodedUser === null || decodedUser === void 0 ? void 0 : decodedUser.userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    //  Update user phone and status
    user.phoneNo = {
        value: payload.phone.toString(),
        isVerified: false,
    };
    user.isActive = user_interface_1.EIsActive.INACTIVE;
    yield user.save();
    if (OTP_ENABLED) {
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        yield user_model_1.UserModel.findByIdAndUpdate(user._id, { otpCode: otp, otpExpiry });
        yield sendWhatsAppOTP(payload.phone.toString(), otp);
    }
    return {
        success: true,
        message: OTP_ENABLED
            ? 'OTP sent successfully via WhatsApp!'
            : 'Phone number updated successfully.',
    };
});
exports.addPhoneNo = addPhoneNo;
const adminLogin = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload.email || !payload.password) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Email and password are required');
    }
    const user = yield user_model_1.UserModel.findOne({ email: payload.email });
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Admin not found');
    }
    if (user.role !== user_interface_1.ERole.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied. Super Admin only.');
    }
    // Check password — supports runtime update via updateAdminCredentials
    const currentPassword = process.env.ADMIN_PASSWORD || env_1.envVars.ADMIN_PASSWORD;
    if (payload.password !== currentPassword) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid password');
    }
    const tokens = (0, createTokens_1.createUserTokens)(user);
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
});
exports.adminLogin = adminLogin;
// ── Firebase Phone Login ──────────────────────────────────────────────────────
// Called after Flutter verifies the OTP via Firebase Auth.
// We verify the Firebase ID token using Admin SDK, then find/create the user
// and return our own JWT tokens — same shape as the existing login response.
const firebasePhoneLogin = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload.idToken || !payload.phone) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'idToken and phone are required');
    }
    // 1. Verify the Firebase ID token — throws if invalid/expired
    const decoded = yield firebase_1.admin.auth().verifyIdToken(payload.idToken);
    if (!decoded.phone_number && !decoded.uid) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid Firebase token');
    }
    // 2. Find existing user by phone
    let user = yield user_model_1.UserModel.findOne({ 'phoneNo.value': payload.phone });
    // 3. Auto-create client if first login
    if (!user) {
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const created = yield user_model_1.UserModel.create([{
                    phoneNo: { value: payload.phone, isVerified: true },
                    role: user_interface_1.ERole.CLIENT,
                    isVerified: true,
                    isActive: user_interface_1.EIsActive.ACTIVE,
                }], { session });
            const userId = created[0]._id;
            const clientProfile = yield client_model_1.ClientProfileModel.create([{
                    userId,
                    profileInfo: { phone: payload.phone },
                    gender: 'MALE',
                }], { session });
            yield user_model_1.UserModel.findByIdAndUpdate(userId, { client: clientProfile[0]._id }, { session });
            yield session.commitTransaction();
            session.endSession();
            user = yield user_model_1.UserModel.findById(userId);
        }
        catch (err) {
            yield session.abortTransaction();
            session.endSession();
            throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `${err}`);
        }
    }
    if (!user)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    if (user.isActive === user_interface_1.EIsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Your account has been blocked.');
    }
    if (user.role === user_interface_1.ERole.LAWYER && user.isActive === user_interface_1.EIsActive.INACTIVE) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'PENDING_APPROVAL');
    }
    // 4. Mark phone as verified (in case it wasn't already)
    if (user.phoneNo && !user.phoneNo.isVerified) {
        user.phoneNo.isVerified = true;
        user.isVerified = true;
        user.isActive = user_interface_1.EIsActive.ACTIVE;
        yield user.save();
    }
    // 5. Return JWT tokens
    const tokens = (0, createTokens_1.createUserTokens)(user);
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
});
exports.firebasePhoneLogin = firebasePhoneLogin;
const updateAdminCredentials = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.UserModel.findById(userId);
    if (!user)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Admin not found');
    if (user.role !== user_interface_1.ERole.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
    }
    if (payload.email)
        user.email = payload.email;
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
    yield user.save();
    return { email: user.email };
});
exports.updateAdminCredentials = updateAdminCredentials;
exports.authServices = {
    createLawyerAccount: exports.createLawyerAccount,
    createClientAccount: exports.createClientAccount,
    verifyOTP: exports.verifyOTP,
    resendOTP: exports.resendOTP,
    userLogin: exports.userLogin,
    adminLogin: exports.adminLogin,
    getNewAccessToken,
    addPhoneNo: exports.addPhoneNo,
    googleMobileLogin,
    addPhoneForGoogleUser,
    firebasePhoneLogin: exports.firebasePhoneLogin,
    updateAdminCredentials: exports.updateAdminCredentials,
};
function googleMobileLogin(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        let user = yield user_model_1.UserModel.findOne({ email: payload.email });
        if (!user) {
            // Create new client account
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const created = yield user_model_1.UserModel.create([{
                        email: payload.email,
                        profilePhoto: payload.photo,
                        role: user_interface_1.ERole.CLIENT,
                        isVerified: true,
                        isActive: user_interface_1.EIsActive.ACTIVE,
                        auths: [{ provider: 'google', providerId: payload.googleId }],
                        // Do NOT set phoneNo — leave undefined so sparse unique index works
                    }], { session });
                const userId = created[0]._id;
                const clientProfile = yield client_model_1.ClientProfileModel.create([{
                        userId,
                        profileInfo: {
                            fast_name: (_b = (_a = payload.name) === null || _a === void 0 ? void 0 : _a.split(' ')[0]) !== null && _b !== void 0 ? _b : '',
                            last_name: (_d = (_c = payload.name) === null || _c === void 0 ? void 0 : _c.split(' ').slice(1).join(' ')) !== null && _d !== void 0 ? _d : '',
                            email: payload.email,
                        },
                    }], { session });
                yield user_model_1.UserModel.findByIdAndUpdate(userId, { client: clientProfile[0]._id }, { session });
                yield session.commitTransaction();
                session.endSession();
                user = yield user_model_1.UserModel.findById(userId);
            }
            catch (err) {
                yield session.abortTransaction();
                session.endSession();
                throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `${err}`);
            }
        }
        else {
            // Update photo if changed
            if (payload.photo && !user.profilePhoto) {
                yield user_model_1.UserModel.findByIdAndUpdate(user._id, { profilePhoto: payload.photo });
            }
            // Add google auth provider if not exists
            const hasGoogle = (_e = user.auths) === null || _e === void 0 ? void 0 : _e.some(a => a.provider === 'google');
            if (!hasGoogle) {
                yield user_model_1.UserModel.findByIdAndUpdate(user._id, {
                    $push: { auths: { provider: 'google', providerId: payload.googleId } }
                });
            }
        }
        if (!user)
            throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create user');
        if (user.isActive === user_interface_1.EIsActive.BLOCKED) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Your account has been blocked.');
        }
        const tokens = (0, createTokens_1.createUserTokens)(user);
        const hasGoogleLinked = (_g = (_f = user.auths) === null || _f === void 0 ? void 0 : _f.some(a => a.provider === 'google')) !== null && _g !== void 0 ? _g : false;
        return Object.assign(Object.assign({}, user.toObject()), { googleLinked: hasGoogleLinked, tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken } });
    });
}
function addPhoneForGoogleUser(userId, phone) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check phone not already used
        const existing = yield user_model_1.UserModel.findOne({ 'phoneNo.value': phone });
        if (existing && existing._id.toString() !== userId) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This phone number is already registered.');
        }
        yield user_model_1.UserModel.findByIdAndUpdate(userId, {
            phoneNo: { value: phone, isVerified: true },
        });
        return { success: true };
    });
}
