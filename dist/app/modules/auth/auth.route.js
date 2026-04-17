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
exports.authRoute = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const passport_1 = __importDefault(require("passport"));
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const router = (0, express_1.Router)();
router.post('/create-lawyer', auth_controller_1.AuthController.createLawyerAccount);
router.post('/create-client', auth_controller_1.AuthController.createClientAccount);
router.post('/verify-otp', auth_controller_1.AuthController.verifyOTP);
router.post('/resend-otp', auth_controller_1.AuthController.resendOTP);
router.post('/login', auth_controller_1.AuthController.userLogin);
router.post('/admin-login', auth_controller_1.AuthController.adminLogin);
router.post('/logout', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), auth_controller_1.AuthController.logout);
router.post('/refresh-token', auth_controller_1.AuthController.getNewAccessToken);
// google auth routes
router.get('/google', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const redirect = req.query.redirect || '/';
    passport_1.default.authenticate("google", { scope: ["profile", "email"], state: redirect })(req, res, next);
}));
router.get("/google/callback", passport_1.default.authenticate("google", { failureRedirect: "/login" }), auth_controller_1.AuthController.googleCallbackController);
// after Google login add phone no
router.patch('/add-phone-no', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), auth_controller_1.AuthController.addPhoneNo);
// FCM Token endpoint
router.post('/save-fcm-token', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), auth_controller_1.AuthController.saveFcmToken);
// Google mobile login (Flutter app)
router.post('/google-mobile', auth_controller_1.AuthController.googleMobileLogin);
// Link Google to existing account (lawyer)
router.post('/link-google', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), auth_controller_1.AuthController.linkGoogle);
// Add phone number after Google login
router.post('/add-phone', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), auth_controller_1.AuthController.addPhoneForGoogleUser);
// Firebase Phone Authentication — verifies Firebase ID token and returns JWT
router.post('/firebase-phone-login', auth_controller_1.AuthController.firebasePhoneLogin);
// Admin credentials update
router.patch('/update-admin', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), auth_controller_1.AuthController.updateAdminCredentials);
exports.authRoute = router;
