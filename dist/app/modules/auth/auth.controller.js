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
exports.AuthController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const auth_service_1 = require("./auth.service");
const setCookie_1 = require("../../utils/setCookie");
const createTokens_1 = require("../../utils/createTokens");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_model_1 = require("../user/user.model");
const user_interface_1 = require("../user/user.interface");
const lawyer_model_1 = require("../lawyer/lawyer.model");
const createLawyerAccount = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const me = yield auth_service_1.authServices.createLawyerAccount(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `${me.message}` || 'Lawyer Account Created Successfully!',
        data: me.data,
    });
}));
const createClientAccount = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const me = yield auth_service_1.authServices.createClientAccount(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Client Account Created Successfully!',
        data: me,
    });
}));
const verifyOTP = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_service_1.authServices.verifyOTP(req.body);
    (0, setCookie_1.setAuthCookie)(res, user.tokens);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'OTP verified successfully!',
        data: user,
    });
}));
const userLogin = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const me = yield auth_service_1.authServices.userLogin(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Data received Successfully!',
        data: me,
    });
}));
const getNewAccessToken = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken;
    const loginInfo = yield auth_service_1.authServices.getNewAccessToken(refreshToken);
    (0, setCookie_1.setAuthCookie)(res, loginInfo);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'AccessToken Created Successfully!',
        data: loginInfo,
    });
}));
const logout = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const user = yield user_model_1.UserModel.findById(decodedUser === null || decodedUser === void 0 ? void 0 : decodedUser.userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    if (user.phoneNo) {
        user.phoneNo.isVerified = false;
        user.isActive = user_interface_1.EIsActive.INACTIVE;
        user.isOnline = true;
        user.lastSeen = new Date();
        yield user.save();
    }
    if (user.lawyer) {
        const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(user.lawyer);
        if (lawyer) {
            lawyer.isOnline = false;
            yield lawyer.save();
        }
    }
    // 🔹 কুকি ক্লিয়ার করা
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User logged out successfully!',
        data: null,
    });
}));
const googleCallbackController = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let redirectTo = req.query.state ? req.query.state : '';
    if (redirectTo.startsWith('/')) {
        redirectTo = redirectTo.slice(1);
    }
    const user = req.user;
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User Not Found');
    }
    const tokenInfo = (0, createTokens_1.createUserTokens)(user);
    (0, setCookie_1.setAuthCookie)(res, tokenInfo);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User log In successfully!',
        data: null,
    });
}));
const addPhoneNo = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const user = yield auth_service_1.authServices.addPhoneNo(decodedUser, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Phone Number Added Successfully! and Send OTP',
        data: user,
    });
}));
const adminLogin = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield auth_service_1.authServices.adminLogin(req.body);
    (0, setCookie_1.setAuthCookie)(res, data.tokens);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Admin logged in successfully!',
        data,
    });
}));
const saveFcmToken = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const { fcmToken } = req.body;
    if (!fcmToken) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'FCM token is required');
    }
    yield user_model_1.UserModel.findByIdAndUpdate(decodedUser === null || decodedUser === void 0 ? void 0 : decodedUser.userId, { $addToSet: { fcmTokens: fcmToken } }, { new: true });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'FCM token saved successfully!',
        data: null,
    });
}));
const googleMobileLogin = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield auth_service_1.authServices.googleMobileLogin(req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Google login successful', data });
}));
const addPhoneForGoogleUser = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const data = yield auth_service_1.authServices.addPhoneForGoogleUser(decodedUser.userId, req.body.phone);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Phone added successfully', data });
}));
const linkGoogle = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const decodedUser = req.user;
    const { email, googleId, photo } = req.body;
    const user = yield user_model_1.UserModel.findById(decodedUser.userId);
    if (!user)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    const hasGoogle = (_a = user.auths) === null || _a === void 0 ? void 0 : _a.some(a => a.provider === 'google');
    if (!hasGoogle) {
        yield user_model_1.UserModel.findByIdAndUpdate(decodedUser.userId, Object.assign(Object.assign({ $push: { auths: { provider: 'google', providerId: googleId } } }, (email && !user.email ? { email } : {})), (photo && !user.profilePhoto ? { profilePhoto: photo } : {})));
    }
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Google account linked', data: { email } });
}));
const resendOTP = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield auth_service_1.authServices.resendOTP(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: data.message,
        data,
    });
}));
const firebasePhoneLogin = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield auth_service_1.authServices.firebasePhoneLogin(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Firebase phone login successful',
        data,
    });
}));
const updateAdminCredentials = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const data = yield auth_service_1.authServices.updateAdminCredentials(decodedUser.userId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Admin credentials updated successfully',
        data,
    });
}));
exports.AuthController = {
    createLawyerAccount,
    createClientAccount,
    verifyOTP,
    resendOTP,
    userLogin,
    adminLogin,
    logout,
    getNewAccessToken,
    googleCallbackController,
    addPhoneNo,
    saveFcmToken,
    googleMobileLogin,
    addPhoneForGoogleUser,
    linkGoogle,
    firebasePhoneLogin,
    updateAdminCredentials,
};
