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
exports.userServices = void 0;
const user_model_1 = require("./user.model");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const constants_1 = require("../../constants");
const notification_helper_1 = require("../notification/notification.helper");
const getMe = (decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const me = yield user_model_1.UserModel.findById(decodedUser.userId).populate([
        { path: 'client' },
        { path: 'lawyer', populate: { path: 'specialties', select: 'title icon' } },
    ]);
    if (!me) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    if (((_a = me.phoneNo) === null || _a === void 0 ? void 0 : _a.isVerified) !== true) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not verified! Please verify your phone number.');
    }
    return me;
});
const getAllUsers = (decodedUser, query) => __awaiter(void 0, void 0, void 0, function* () {
    const SUPER_ADMIN = yield user_model_1.UserModel.findById(decodedUser.userId);
    if (!SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'You are not authorized to access this resource');
    }
    const users = user_model_1.UserModel.find().populate('lawyer client');
    const queryBuilder = new QueryBuilder_1.QueryBuilder(users, query);
    const allUsers = queryBuilder
        .search(constants_1.userSearchableFields)
        .filter()
        .paginate();
    const [data, meta] = yield Promise.all([
        allUsers.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const updateUser = (decodedUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield user_model_1.UserModel.findById(decodedUser.userId).populate('lawyer client');
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    if (((_a = user.phoneNo) === null || _a === void 0 ? void 0 : _a.isVerified) !== true) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not verified! Please verify your phone number.');
    }
    // Check if status is being changed
    const oldStatus = user.isActive;
    const newStatus = payload.isActive;
    const updatedUser = yield user_model_1.UserModel.findByIdAndUpdate(decodedUser.userId, payload, { new: true });
    // Send notification if status changed
    if (newStatus && oldStatus !== newStatus) {
        try {
            yield notification_helper_1.NotificationHelper.notifyAccountStatusChanged(user._id, newStatus);
        }
        catch (error) {
            console.error('Error sending status change notification:', error);
        }
    }
    return updatedUser;
});
exports.userServices = {
    getMe,
    getAllUsers,
    updateUser,
};
