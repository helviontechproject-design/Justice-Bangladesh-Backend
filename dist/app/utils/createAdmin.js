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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdmin = void 0;
const user_model_1 = require("../modules/user/user.model");
const env_1 = require("../config/env");
const user_interface_1 = require("../modules/user/user.interface");
const createAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isAdminExist = yield user_model_1.UserModel.findOne({
            email: env_1.envVars.ADMIN_EMAIL,
        });
        if (isAdminExist) {
            console.log('Super Admin Already Exists!');
            return;
        }
        // 🌐 Auth Provider info
        const authProvider = {
            provider: 'email',
            providerId: env_1.envVars.ADMIN_EMAIL,
        };
        // 🧩 Payload as per your IUser model
        const payload = {
            email: env_1.envVars.ADMIN_EMAIL,
            phoneNo: {
                value: env_1.envVars.ADMIN_PHONE,
            },
            role: user_interface_1.ERole.SUPER_ADMIN,
            isVerified: true,
            isActive: user_interface_1.EIsActive.ACTIVE,
            isDeleted: false,
            auths: [authProvider],
            notifications: [],
        };
        // ✅ Create admin user
        yield user_model_1.UserModel.create(payload);
        console.log('✅ Super Admin Created Successfully!');
    }
    catch (error) {
        console.error('❌ Failed to create Super Admin:', error);
    }
});
exports.createAdmin = createAdmin;
