"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const user_interface_1 = require("./user.interface");
const AuthProviderSchema = new mongoose_1.Schema({
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
}, { _id: false });
const UserSchema = new mongoose_1.Schema({
    email: { type: String, required: false, unique: true, sparse: true, trim: true },
    phoneNo: {
        type: new mongoose_1.Schema({
            value: {
                type: String,
                sparse: true,
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
        enum: Object.values(user_interface_1.EIsActive),
        default: user_interface_1.EIsActive.ACTIVE,
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: new Date() },
    client: { type: mongoose_1.Types.ObjectId, ref: 'ClientProfile' },
    lawyer: { type: mongoose_1.Types.ObjectId, ref: 'LawyerProfile' },
    role: {
        type: String,
        enum: Object.values(user_interface_1.ERole),
        default: user_interface_1.ERole.CLIENT,
    },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    notifications: [{ type: mongoose_1.Types.ObjectId, ref: 'Notification' }],
    auths: { type: [AuthProviderSchema], default: [] },
    fcmTokens: { type: [String], default: [] },
    otpCode: { type: String },
    otpExpiry: { type: Date },
}, {
    timestamps: true,
});
// ===== Model =====
exports.UserModel = (0, mongoose_1.model)('User', UserSchema);
