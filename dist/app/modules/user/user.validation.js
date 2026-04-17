"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const user_interface_1 = require("./user.interface");
const objectIdString = () => zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid ObjectId string' });
const phoneNoSchema = zod_1.z.object({
    value: zod_1.z.string().min(6, 'phone number too short').max(20),
    isVerified: zod_1.z.boolean(),
});
const authProviderSchema = zod_1.z.object({
    provider: zod_1.z.string().min(1),
    providerId: zod_1.z.string().min(1),
});
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    phoneNo: phoneNoSchema.optional(),
    password: zod_1.z.string().min(6).optional(),
    profilePhoto: zod_1.z.string().url().optional(),
    date_of_birth: zod_1.z.string().optional(),
    isActive: zod_1.z.nativeEnum(user_interface_1.EIsActive).optional(),
    client: objectIdString().optional(),
    lawyer: objectIdString().optional(),
    role: zod_1.z.nativeEnum(user_interface_1.ERole).optional(),
    isDeleted: zod_1.z.boolean().optional(),
    notifications: zod_1.z.array(objectIdString()).optional(),
    auths: zod_1.z.array(authProviderSchema).optional(),
});
exports.updateUserSchema = zod_1.z
    .object({
    email: zod_1.z.string().email().optional(),
    phoneNo: phoneNoSchema.optional(),
    password: zod_1.z.string().min(6).optional(),
    profilePhoto: zod_1.z.string().url().optional(),
    date_of_birth: zod_1.z.string().optional(),
    isActive: zod_1.z.nativeEnum(user_interface_1.EIsActive).optional(),
    client: objectIdString().optional(),
    lawyer: objectIdString().optional(),
    role: zod_1.z.nativeEnum(user_interface_1.ERole).optional(),
    isDeleted: zod_1.z.boolean().optional(),
    notifications: zod_1.z.array(objectIdString()).optional(),
    auths: zod_1.z.array(authProviderSchema).optional(),
})
    .strict();
