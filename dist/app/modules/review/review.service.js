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
exports.reviewService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const review_model_1 = require("./review.model");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const mongoose_1 = require("mongoose");
const client_model_1 = require("../client/client.model");
const lawyer_model_1 = require("../lawyer/lawyer.model");
// Helper function to calculate and update lawyer's average rating
const updateLawyerAverageRating = (lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const avgResult = yield review_model_1.ClientReview.aggregate([
        { $match: { lawyerId: new mongoose_1.Types.ObjectId(lawyerId), isApproved: true } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]);
    const avgRating = ((_a = avgResult[0]) === null || _a === void 0 ? void 0 : _a.avgRating) || 0;
    const totalReviews = ((_b = avgResult[0]) === null || _b === void 0 ? void 0 : _b.totalReviews) || 0;
    yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, {
        avarage_rating: Number(avgRating.toFixed(2)),
        totalReviews,
    });
});
const createReview = (decodedUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify lawyer exists
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(payload.lawyerId);
    if (!lawyer)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
    // Get client profile if logged in
    let clientId = null;
    if (decodedUser === null || decodedUser === void 0 ? void 0 : decodedUser.userId) {
        const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
        if (client) {
            clientId = client._id;
            // Check duplicate
            const existing = yield review_model_1.ClientReview.findOne({ clientId, lawyerId: payload.lawyerId });
            if (existing)
                throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You have already reviewed this lawyer');
        }
    }
    const review = yield review_model_1.ClientReview.create({
        clientId,
        lawyerId: payload.lawyerId,
        rating: payload.rating,
        comment: payload.comment,
        isApproved: false,
    });
    if (clientId) {
        if (payload.lawyerId) {
            yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(payload.lawyerId, { $push: { reviews: review._id } });
        }
    }
    return review;
});
const getAllReviews = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const reviews = review_model_1.ClientReview.find()
        .populate('clientId', '_id profileInfo')
        .populate('lawyerId', '_id profile_Details');
    const queryBuilder = new QueryBuilder_1.QueryBuilder(reviews, query);
    const allReviews = queryBuilder.filter().sort().paginate();
    const [data, meta] = yield Promise.all([
        allReviews.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getReviewsByService = (serviceId) => __awaiter(void 0, void 0, void 0, function* () {
    const reviews = yield review_model_1.ClientReview.find({ serviceId: new mongoose_1.Types.ObjectId(serviceId), isApproved: true })
        .populate('clientId', '_id profileInfo userId')
        .sort({ createdAt: -1 });
    return reviews;
});
const getReviewsByLawyer = (lawyerId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(lawyerId);
    if (!lawyer)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
    // Only show approved reviews to public
    const reviews = review_model_1.ClientReview.find({ lawyerId: new mongoose_1.Types.ObjectId(lawyerId), isApproved: true })
        .populate('clientId', '_id profileInfo userId')
        .sort({ createdAt: -1 });
    const queryBuilder = new QueryBuilder_1.QueryBuilder(reviews, query);
    const lawyerReviews = queryBuilder.filter().paginate();
    const [data, meta] = yield Promise.all([lawyerReviews.build().exec(), queryBuilder.getMeta()]);
    const avgRating = yield review_model_1.ClientReview.aggregate([
        { $match: { lawyerId: new mongoose_1.Types.ObjectId(lawyerId), isApproved: true } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]);
    return { data, meta, stats: avgRating[0] || { avgRating: 0, totalReviews: 0 } };
});
// Admin: get all reviews (pending + approved)
const adminGetAllReviews = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const reviews = review_model_1.ClientReview.find()
        .populate('clientId', '_id profileInfo')
        .populate('lawyerId', '_id profile_Details')
        .sort({ createdAt: -1 });
    const queryBuilder = new QueryBuilder_1.QueryBuilder(reviews, query);
    const result = queryBuilder.filter().sort().paginate();
    const [data, meta] = yield Promise.all([result.build().exec(), queryBuilder.getMeta()]);
    return { data, meta };
});
// Admin: approve review
const adminApproveReview = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield review_model_1.ClientReview.findById(id);
    if (!review)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    review.isApproved = !review.isApproved;
    yield review.save();
    // Recalculate lawyer rating based on approved reviews only
    if (review.lawyerId) {
        yield updateLawyerAverageRating(review.lawyerId.toString());
    }
    return review;
});
// Admin: delete review
const adminDeleteReview = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield review_model_1.ClientReview.findById(id);
    if (!review)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    if (review.lawyerId) {
        yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(review.lawyerId, { $pull: { reviews: review._id } });
    }
    yield review_model_1.ClientReview.findByIdAndDelete(id);
    if (review.lawyerId) {
        yield updateLawyerAverageRating(review.lawyerId.toString());
    }
});
const getMyReviews = (decodedUser, query) => __awaiter(void 0, void 0, void 0, function* () {
    if (!decodedUser.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized user');
    }
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found');
    }
    const reviews = review_model_1.ClientReview.find({ clientId: client._id })
        .populate('lawyerId', '_id profile_Details')
        .sort({ createdAt: -1 });
    const queryBuilder = new QueryBuilder_1.QueryBuilder(reviews, query);
    const myReviews = queryBuilder.filter().paginate();
    const [data, meta] = yield Promise.all([
        myReviews.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getSingleReview = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield review_model_1.ClientReview.findById(id)
        .populate('clientId', '_id profileInfo')
        .populate('lawyerId', '_id profile_Details');
    if (!review) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    }
    return review;
});
const updateReview = (id, decodedUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield review_model_1.ClientReview.findById(id);
    if (!review) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    }
    // Only client can update their own review
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client || !review.clientId.equals(client._id)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You can only update your own reviews');
    }
    const updatedReview = yield review_model_1.ClientReview.findByIdAndUpdate(id, payload, {
        new: true,
    })
        .populate('clientId', '_id profileInfo')
        .populate('lawyerId', '_id profile_Details');
    // Update lawyer's average rating after review update
    if (updatedReview && updatedReview.lawyerId) {
        yield updateLawyerAverageRating(updatedReview.lawyerId.toString());
    }
    return updatedReview;
});
const deleteReview = (id, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield review_model_1.ClientReview.findById(id);
    if (!review) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    }
    // Only client can delete their own review
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client || !review.clientId.equals(client._id)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You can only delete your own reviews');
    }
    // Remove review from lawyer's reviews array
    yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(review.lawyerId, {
        $pull: { reviews: review._id },
    });
    yield review_model_1.ClientReview.findByIdAndDelete(id);
    // Update lawyer's average rating after review deletion
    if (review.lawyerId) {
        yield updateLawyerAverageRating(review.lawyerId.toString());
    }
});
const getReviewStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const totalReviews = yield review_model_1.ClientReview.countDocuments();
    const ratingDistribution = yield review_model_1.ClientReview.aggregate([
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);
    const avgRating = yield review_model_1.ClientReview.aggregate([
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
            },
        },
    ]);
    return {
        totalReviews,
        ratingDistribution,
        avgRating: ((_a = avgRating[0]) === null || _a === void 0 ? void 0 : _a.avgRating) || 0,
    };
});
exports.reviewService = {
    createReview,
    getAllReviews,
    adminGetAllReviews,
    adminApproveReview,
    adminDeleteReview,
    getReviewsByLawyer,
    getReviewsByService,
    getMyReviews,
    getSingleReview,
    updateReview,
    deleteReview,
    getReviewStats,
};
