"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const review_controller_1 = require("./review.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const review_validation_1 = require("./review.validation");
const router = (0, express_1.Router)();
// Admin routes
router.get('/admin/all', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), review_controller_1.reviewController.adminGetAllReviews);
router.patch('/admin/:id/approve', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), review_controller_1.reviewController.adminApproveReview);
router.delete('/admin/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), review_controller_1.reviewController.adminDeleteReview);
// Create review (public for development)
router.post('/', review_controller_1.reviewController.createReview);
// Get my reviews (CLIENT only)
router.get('/my-reviews', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), review_controller_1.reviewController.getMyReviews);
// Get review statistics (SUPER_ADMIN only)
router.get('/stats', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), review_controller_1.reviewController.getReviewStats);
// Get reviews by service ID (public)
router.get('/service/:serviceId', review_controller_1.reviewController.getReviewsByService);
// Get reviews by lawyer ID (public)
router.get('/lawyer/:lawyerId', review_controller_1.reviewController.getReviewsByLawyer);
// Get all reviews (SUPER_ADMIN only)
router.get('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), review_controller_1.reviewController.getAllReviews);
// Get single review by ID (public)
router.get('/:id', review_controller_1.reviewController.getSingleReview);
// Update review (CLIENT only - own only)
router.patch('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), (0, validateRequest_1.validateRequest)(review_validation_1.updateReviewZod), review_controller_1.reviewController.updateReview);
// Delete review (CLIENT only - own only)
router.delete('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), review_controller_1.reviewController.deleteReview);
exports.reviewRoute = router;
