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
exports.reviewController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const review_service_1 = require("./review.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const createReview = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const decodedUser = (_a = req.user) !== null && _a !== void 0 ? _a : null;
    const review = yield review_service_1.reviewService.createReview(decodedUser, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: 'Review submitted successfully',
        data: review,
    });
}));
const getAllReviews = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield review_service_1.reviewService.getAllReviews(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Reviews fetched successfully',
        data: result.data,
        meta: result.meta,
    });
}));
const getReviewsByLawyer = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { lawyerId } = req.params;
    const result = yield review_service_1.reviewService.getReviewsByLawyer(lawyerId, req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Lawyer reviews fetched successfully',
        data: result.data,
        meta: result.meta,
    });
}));
const getMyReviews = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const result = yield review_service_1.reviewService.getMyReviews(decodedUser, req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Your reviews fetched successfully',
        data: result.data,
        meta: result.meta,
    });
}));
const getSingleReview = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const review = yield review_service_1.reviewService.getSingleReview(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Review fetched successfully',
        data: review,
    });
}));
const updateReview = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const decodedUser = req.user;
    const review = yield review_service_1.reviewService.updateReview(id, decodedUser, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Review updated successfully',
        data: review,
    });
}));
const deleteReview = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const decodedUser = req.user;
    yield review_service_1.reviewService.deleteReview(id, decodedUser);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Review deleted successfully',
        data: null,
    });
}));
const getReviewStats = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield review_service_1.reviewService.getReviewStats();
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Review statistics fetched successfully', data: stats });
}));
const adminGetAllReviews = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield review_service_1.reviewService.adminGetAllReviews(req.query);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'All reviews fetched', data: result.data, meta: result.meta });
}));
const adminApproveReview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield review_service_1.reviewService.adminApproveReview(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: `Review ${result.isApproved ? 'approved' : 'unapproved'}`, data: result });
}));
const adminDeleteReview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield review_service_1.reviewService.adminDeleteReview(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Review deleted', data: null });
}));
const getReviewsByService = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceId } = req.params;
    const result = yield review_service_1.reviewService.getReviewsByService(serviceId);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Service reviews fetched', data: result });
}));
exports.reviewController = {
    createReview, getAllReviews, getReviewsByLawyer, getReviewsByService, getMyReviews,
    getSingleReview, updateReview, deleteReview, getReviewStats,
    adminGetAllReviews, adminApproveReview, adminDeleteReview,
};
