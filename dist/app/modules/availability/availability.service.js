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
exports.availabilityService = exports.setAvailability = void 0;
const availability_model_1 = require("./availability.model");
const mongoose_1 = require("mongoose");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const constants_1 = require("../../constants");
const lawyer_model_1 = require("../lawyer/lawyer.model");
const setAvailability = (decodedUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const lawyerId = payload.lawyerId;
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({
        userId: decodedUser.userId,
    });
    if (!lawyer) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized user");
    }
    const payloadLawyerId = new mongoose_1.Types.ObjectId(payload === null || payload === void 0 ? void 0 : payload.lawyerId);
    if (!lawyer._id.equals(payloadLawyerId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized user");
    }
    //  Basic validation
    if (!payload.month || !payload.bookingType) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Missing required fields");
    }
    //  Check if availability for this month and bookingType already exists
    const existingAvailability = yield availability_model_1.AvailabilityModel.findOne({
        lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
        bookingType: payload.bookingType,
        month: payload.month,
    });
    if (existingAvailability) {
        //  Update existing availability
        existingAvailability.availableDates =
            payload.availableDates || existingAvailability.availableDates;
        existingAvailability.isActive =
            (_a = payload.isActive) !== null && _a !== void 0 ? _a : existingAvailability.isActive;
        yield existingAvailability.save();
        return {
            success: true,
            message: `Availability for ${payload.month} updated successfully`,
            data: existingAvailability,
        };
    }
    else {
        // Create new monthly availability
        const newAvailability = yield availability_model_1.AvailabilityModel.create({
            lawyerId,
            bookingType: payload.bookingType,
            month: payload.month,
            availableDates: payload.availableDates || [],
            isActive: (_b = payload.isActive) !== null && _b !== void 0 ? _b : true,
        });
        yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, {
            $push: { availability: newAvailability._id },
        }, { new: true });
        return {
            success: true,
            message: `Availability for ${payload.month} created successfully`,
            data: newAvailability,
        };
    }
});
exports.setAvailability = setAvailability;
const getAvailability = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const availabilities = availability_model_1.AvailabilityModel.find();
    const queryBuilder = new QueryBuilder_1.QueryBuilder(availabilities, query);
    const allAvailabilities = queryBuilder
        .search(constants_1.availabilitiesSearchableFields)
        .filter()
        .paginate();
    const [data, meta] = yield Promise.all([
        allAvailabilities.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getAvailabilityById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const availability = yield availability_model_1.AvailabilityModel.findById(id).populate("lawyerId");
    if (!availability) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Availability not found");
    }
    return availability;
});
const deleteAvailability = (id, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    const availability = yield availability_model_1.AvailabilityModel.findById(id);
    if (!availability) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Availability not found");
    }
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({
        userId: decodedUser.userId,
    });
    if (!lawyer) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized user");
    }
    if (!lawyer._id.equals(availability.lawyerId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "You can only delete your own availability");
    }
    yield availability_model_1.AvailabilityModel.findByIdAndDelete(id);
});
const getMyAvailability = (decodedUser, query) => __awaiter(void 0, void 0, void 0, function* () {
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({
        userId: decodedUser.userId,
    });
    if (!lawyer) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized user");
    }
    const availabilities = availability_model_1.AvailabilityModel.find({ lawyerId: lawyer._id });
    const queryBuilder = new QueryBuilder_1.QueryBuilder(availabilities, query);
    const allAvailabilities = queryBuilder.filter().paginate();
    const [data, meta] = yield Promise.all([
        allAvailabilities.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
function getAvailabilityByLawyerId(lawyerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return availability_model_1.AvailabilityModel.find({ lawyerId: new mongoose_1.Types.ObjectId(lawyerId) }).sort({ month: 1 });
    });
}
function adminSetAvailability(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const { lawyerId, bookingType, month, availableDates, isActive } = payload;
        if (!lawyerId || !bookingType || !month) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Missing required fields');
        }
        const existing = yield availability_model_1.AvailabilityModel.findOne({
            lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
            bookingType,
            month,
        });
        if (existing) {
            existing.availableDates = availableDates || existing.availableDates;
            if (isActive !== undefined)
                existing.isActive = isActive;
            yield existing.save();
            return existing;
        }
        const created = yield availability_model_1.AvailabilityModel.create({ lawyerId, bookingType, month, availableDates: availableDates || [], isActive: isActive !== null && isActive !== void 0 ? isActive : true });
        yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, { $addToSet: { availability: created._id } });
        return created;
    });
}
exports.availabilityService = {
    setAvailability: exports.setAvailability,
    getAvailability,
    getAvailabilityById,
    deleteAvailability,
    getMyAvailability,
    getAvailabilityByLawyerId,
    adminSetAvailability,
};
