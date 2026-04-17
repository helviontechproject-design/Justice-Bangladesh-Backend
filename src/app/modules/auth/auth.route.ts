import { NextFunction, Request, Response, Router } from "express";
import { AuthController } from "./auth.controller";
import passport from "passport";
import { checkAuth } from "../../middlewares/checkAuth";
import { ERole } from "../user/user.interface";





const router = Router()


router.post('/create-lawyer', AuthController.createLawyerAccount);

router.post('/create-client', AuthController.createClientAccount);

router.post('/verify-otp', AuthController.verifyOTP);

router.post('/resend-otp', AuthController.resendOTP);

router.post('/login', AuthController.userLogin)

router.post('/admin-login', AuthController.adminLogin)

router.post('/logout', checkAuth(...Object.values(ERole)), AuthController.logout)

router.post('/refresh-token', AuthController.getNewAccessToken)


// google auth routes
router.get('/google', async (req: Request, res: Response, next: NextFunction) => {
  const redirect = req.query.redirect || '/'
  passport.authenticate("google", {scope: ["profile","email"],state: redirect as string })(req, res,next)
})

router.get("/google/callback", passport.authenticate("google", {failureRedirect: "/login"}), AuthController.googleCallbackController)

// after Google login add phone no
router.patch('/add-phone-no', checkAuth(...Object.values(ERole)), AuthController.addPhoneNo)

// FCM Token endpoint
router.post('/save-fcm-token', checkAuth(...Object.values(ERole)), AuthController.saveFcmToken)

// Google mobile login (Flutter app)
router.post('/google-mobile', AuthController.googleMobileLogin)

// Link Google to existing account (lawyer)
router.post('/link-google', checkAuth(...Object.values(ERole)), AuthController.linkGoogle)

// Add phone number after Google login
router.post('/add-phone', checkAuth(...Object.values(ERole)), AuthController.addPhoneForGoogleUser)

// Firebase Phone Authentication — verifies Firebase ID token and returns JWT
router.post('/firebase-phone-login', AuthController.firebasePhoneLogin)

// Admin credentials update
router.patch('/update-admin', checkAuth(ERole.SUPER_ADMIN), AuthController.updateAdminCredentials)

export const authRoute = router