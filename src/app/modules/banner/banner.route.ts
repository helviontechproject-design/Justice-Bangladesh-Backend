import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { ERole } from "../user/user.interface";
import { bannerController } from "./banner.controller";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middlewares/validateRequest";
import { createBannerZod, updateBannerZod } from "./banner.validation";

const router = Router();

router.get("/", bannerController.getAllBanners);

router.post(
  "/create",
  checkAuth(ERole.SUPER_ADMIN),
  multerUpload.single("ImageUrl"),
  validateRequest(createBannerZod),
  bannerController.createBanner,
);

router.patch(
  "/update/:id",
  checkAuth(ERole.SUPER_ADMIN),
  multerUpload.single("ImageUrl"),
  validateRequest(updateBannerZod),
  bannerController.updateBanner,
);
router.delete(
  "/delete/:id",
  checkAuth(ERole.SUPER_ADMIN),
  bannerController.deleteBanner,
);

export const bannerRoute = router;
