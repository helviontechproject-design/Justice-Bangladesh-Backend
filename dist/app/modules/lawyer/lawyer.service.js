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
exports.lawyerServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const lawyer_model_1 = require("./lawyer.model");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const constants_1 = require("../../constants");
const client_model_1 = require("../client/client.model");
const user_model_1 = require("../user/user.model");
const user_interface_1 = require("../user/user.interface");
const getPopularLawyers = () => __awaiter(void 0, void 0, void 0, function* () {
    return lawyer_model_1.LawyerProfileModel.find({ isPopular: true })
        .populate('userId', 'email profilePhoto isActive')
        .populate('specialties', 'title icon')
        .select('profile_Details lawyerDetails quialification designation per_consultation_fee avarage_rating appointments_Count totalReviews isPopular isSpecial userId specialties')
        .sort({ avarage_rating: -1 })
        .limit(20);
});
const getAllLawyers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    // Build initial filter for categories, specialties, services
    const initialFilter = {};
    // Handle category filtering - use string IDs since DB has strings
    if (query.categories) {
        const categoryIds = query.categories.split(',').map(id => id.trim());
        initialFilter.categories = { $in: categoryIds };
    }
    // Handle specialty filtering
    if (query.specialties) {
        const specialtyIds = query.specialties.split(',').map(id => id.trim());
        initialFilter.specialties = { $in: specialtyIds };
    }
    // Handle service filtering
    if (query.services) {
        const serviceIds = query.services.split(',').map(id => id.trim());
        initialFilter.services = { $in: serviceIds };
    }
    // Handle consultation fee filtering
    if (query.minFee || query.maxFee) {
        initialFilter.per_consultation_fee = {};
        if (query.minFee) {
            initialFilter.per_consultation_fee.$gte = Number(query.minFee);
        }
        if (query.maxFee) {
            initialFilter.per_consultation_fee.$lte = Number(query.maxFee);
        }
    }
    // Handle rating filtering - range based (e.g., rating=3 matches 3.0-3.99)
    if (query.avarage_rating) {
        const rating = Number(query.avarage_rating);
        initialFilter.avarage_rating = {
            $gte: rating,
            $lt: rating + 1
        };
    }
    // Create query with initial filter
    const lawyers = lawyer_model_1.LawyerProfileModel.find(initialFilter)
        .populate('userId', 'email profilePhoto isActive isOnline lastSeen')
        .populate('specialties', 'title')
        .populate('categories', 'name slug icon imageUrl _id')
        .select('-walletId -withdrawals -reviews -work_experience -favorite_count -appointments_Count -services -lawyerDetails -chambers_Count -contactInfo -educations -totalReviews');
    // Remove custom filters from query object for QueryBuilder
    const queryWithoutCustomFilters = Object.assign({}, query);
    delete queryWithoutCustomFilters.categories;
    delete queryWithoutCustomFilters.specialties;
    delete queryWithoutCustomFilters.avarage_rating;
    delete queryWithoutCustomFilters.minRating;
    delete queryWithoutCustomFilters.maxRating;
    delete queryWithoutCustomFilters.minFee;
    delete queryWithoutCustomFilters.maxFee;
    const queryBuilder = new QueryBuilder_1.QueryBuilder(lawyers, queryWithoutCustomFilters);
    const allLawyers = queryBuilder
        .search(constants_1.lawyerSearchableFields)
        .filter()
        .sort()
        .paginate();
    const [data, meta] = yield Promise.all([
        allLawyers.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const updateLawyer = (decodedUser, lawyerId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(lawyerId);
    if (!decodedUser.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are not authorized to perform this action');
    }
    if (!lawyer) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'lawyer not found');
    }
    // Auto-update chambers_Count when chambers array is provided
    if (Array.isArray(payload.chambers)) {
        payload.chambers_Count = payload.chambers.length;
    }
    // Flatten nested objects into dot-notation $set to prevent overwriting
    // sibling fields inside the same nested object (e.g. lawyerDetails, profile_Details)
    const flatSet = {};
    for (const [key, value] of Object.entries(payload)) {
        if (value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            !(value instanceof Date)) {
            for (const [nestedKey, nestedValue] of Object.entries(value)) {
                flatSet[`${key}.${nestedKey}`] = nestedValue;
            }
        }
        else {
            flatSet[key] = value;
        }
    }
    const updatedLawyer = yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, { $set: flatSet }, { new: true });
    return updatedLawyer;
});
const getLawyerById = (lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(lawyerId)
        .populate('availability', 'bookingType month availableDates isActive createdAt updatedAt')
        .populate('userId', 'name phoneNo email profilePhoto isActive')
        .populate('specialties', 'title')
        .populate('categories', 'name slug icon imageUrl _id')
        .populate('services', 'name slug icon')
        .populate('reviews')
        .populate('work_experience')
        .select('-walletId -withdrawals');
    if (!lawyer) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
    }
    yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, { $inc: { views: 1 } });
    return lawyer;
});
const saveLawyerByClient = (decodedUser, lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Get client profile
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found');
    }
    // Verify lawyer exists
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(lawyerId);
    if (!lawyer) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
    }
    // Check if lawyer is already saved
    const isAlreadySaved = (_a = client.savedLawyers) === null || _a === void 0 ? void 0 : _a.some((savedId) => savedId.toString() === lawyerId);
    if (isAlreadySaved) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Lawyer is already in your saved list');
    }
    // Add lawyer to client's saved list
    yield client_model_1.ClientProfileModel.findByIdAndUpdate(client._id, {
        $push: { savedLawyers: lawyerId },
    });
    // Increment lawyer's favorite count
    yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, {
        $inc: { favorite_count: 1 },
    });
    return {
        message: 'Lawyer saved successfully',
        lawyerId,
    };
});
const removeSavedLawyer = (decodedUser, lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Get client profile
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found');
    }
    // Verify lawyer exists
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(lawyerId);
    if (!lawyer) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
    }
    // Check if lawyer is in saved list
    const isSaved = (_a = client.savedLawyers) === null || _a === void 0 ? void 0 : _a.some((savedId) => savedId.toString() === lawyerId);
    if (!isSaved) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Lawyer is not in your saved list');
    }
    // Remove lawyer from client's saved list
    yield client_model_1.ClientProfileModel.findByIdAndUpdate(client._id, {
        $pull: { savedLawyers: lawyerId },
    });
    // Decrement lawyer's favorite count (but not below 0)
    yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, {
        $inc: { favorite_count: -1 },
    });
    // Ensure favorite_count doesn't go below 0
    const updatedLawyer = yield lawyer_model_1.LawyerProfileModel.findById(lawyerId);
    if (updatedLawyer && updatedLawyer.favorite_count && updatedLawyer.favorite_count < 0) {
        yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, {
            favorite_count: 0,
        });
    }
    return {
        message: 'Lawyer removed from saved list successfully',
        lawyerId,
    };
});
const getMySavedLawyers = (decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Get client profile with populated saved lawyers
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId })
        .populate({
        path: 'savedLawyers',
        populate: [
            { path: 'userId', select: 'name email profile' },
            { path: 'specialties', select: 'name' },
            { path: 'categories', select: 'name slug icon' },
        ]
    });
    if (!client) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found');
    }
    return {
        savedLawyers: client.savedLawyers || [],
        totalSaved: ((_a = client.savedLawyers) === null || _a === void 0 ? void 0 : _a.length) || 0,
    };
});
// ===== ADMIN FUNCTIONS =====
const adminGetAllLawyers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const lawyers = lawyer_model_1.LawyerProfileModel.find()
        .populate('userId', 'email profilePhoto isActive isVerified isDeleted createdAt phoneNo')
        .populate('specialties', 'title')
        .populate('categories', 'name slug')
        .select('-walletId -withdrawals -reviews -work_experience -favorite_count -services -lawyerDetails.bar_council_certificate');
    const queryBuilder = new QueryBuilder_1.QueryBuilder(lawyers, query);
    const result = queryBuilder.search(constants_1.lawyerSearchableFields).filter().sort().paginate();
    const [data, meta] = yield Promise.all([result.build().exec(), queryBuilder.getMeta()]);
    return { data, meta };
});
const adminBanLawyer = (lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    const profile = yield lawyer_model_1.LawyerProfileModel.findById(lawyerId);
    if (!profile)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
    const user = yield user_model_1.UserModel.findById(profile.userId);
    if (!user)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    const newStatus = user.isActive === user_interface_1.EIsActive.BLOCKED ? user_interface_1.EIsActive.ACTIVE : user_interface_1.EIsActive.BLOCKED;
    yield user_model_1.UserModel.findByIdAndUpdate(profile.userId, { isActive: newStatus });
    return { userId: profile.userId, isActive: newStatus };
});
const adminVerifyLawyer = (lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    const profile = yield lawyer_model_1.LawyerProfileModel.findById(lawyerId);
    if (!profile)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
    const user = yield user_model_1.UserModel.findById(profile.userId);
    if (!user)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    const newVerified = !user.isVerified;
    const newActive = newVerified ? user_interface_1.EIsActive.ACTIVE : user_interface_1.EIsActive.INACTIVE;
    yield user_model_1.UserModel.findByIdAndUpdate(profile.userId, {
        isVerified: newVerified,
        isActive: newActive,
    });
    return { userId: profile.userId, isVerified: newVerified, isActive: newActive };
});
const adminDeleteLawyer = (lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    const profile = yield lawyer_model_1.LawyerProfileModel.findById(lawyerId);
    if (!profile)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
    yield user_model_1.UserModel.findByIdAndUpdate(profile.userId, { isDeleted: true });
    yield lawyer_model_1.LawyerProfileModel.findByIdAndDelete(lawyerId);
    return { deleted: true };
});
const adminUpdateLawyer = (lawyerId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const profile = yield lawyer_model_1.LawyerProfileModel.findById(lawyerId);
    if (!profile)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
    return lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, payload, { new: true })
        .populate('userId', 'email profilePhoto isActive isVerified phoneNo')
        .populate('specialties', 'title')
        .populate('categories', 'name slug');
});
const adminGetLawyerProfile = (lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    return lawyer_model_1.LawyerProfileModel.findById(lawyerId).select('userId');
});
exports.lawyerServices = {
    getPopularLawyers,
    getAllLawyers,
    updateLawyer,
    getLawyerById,
    saveLawyerByClient,
    removeSavedLawyer,
    getMySavedLawyers,
    adminGetAllLawyers,
    adminBanLawyer,
    adminVerifyLawyer,
    adminDeleteLawyer,
    adminUpdateLawyer,
};
