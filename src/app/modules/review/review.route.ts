import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { ERole } from "../user/user.interface";
import { reviewController } from "./review.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createReviewZod, updateReviewZod } from "./review.validation";

const router = Router()

// Admin routes
router.get('/admin/all', checkAuth(ERole.SUPER_ADMIN), reviewController.adminGetAllReviews);
router.patch('/admin/:id/approve', checkAuth(ERole.SUPER_ADMIN), reviewController.adminApproveReview);
router.delete('/admin/:id', checkAuth(ERole.SUPER_ADMIN), reviewController.adminDeleteReview);

// Create review (public for development)
router.post('/', reviewController.createReview);

// Get my reviews (CLIENT only)
router.get(
  '/my-reviews',
  checkAuth(ERole.CLIENT),
  reviewController.getMyReviews
);

// Get review statistics (SUPER_ADMIN only)
router.get(
  '/stats',
  checkAuth(ERole.SUPER_ADMIN),
  reviewController.getReviewStats
);

// Get reviews by service ID (public)
router.get(
  '/service/:serviceId',
  reviewController.getReviewsByService
);

// Get reviews by lawyer ID (public)
router.get(
  '/lawyer/:lawyerId',
  reviewController.getReviewsByLawyer
);

// Get all reviews (SUPER_ADMIN only)
router.get(
  '/',
  checkAuth(ERole.SUPER_ADMIN),
  reviewController.getAllReviews
);

// Get single review by ID (public)
router.get(
  '/:id',
  reviewController.getSingleReview
);

// Update review (CLIENT only - own only)
router.patch(
  '/:id',
  checkAuth(ERole.CLIENT),
  validateRequest(updateReviewZod),
  reviewController.updateReview
);

// Delete review (CLIENT only - own only)
router.delete(
  '/:id',
  checkAuth(ERole.CLIENT),
  reviewController.deleteReview
);

export const reviewRoute = router;