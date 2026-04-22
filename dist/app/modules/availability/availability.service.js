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
        // Auto-enable visibility settings when availability is saved
        const visibilityUpdate = {};
        if (payload.bookingType === 'Video Call')
            visibilityUpdate.videoConsult = true;
        else if (payload.bookingType === 'Audio Call')
            visibilityUpdate.audioCall = true;
        else if (payload.bookingType === 'In Person')
            visibilityUpdate.inPerson = true;
        if (Object.keys(visibilityUpdate).length > 0) {
            yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, { $set: visibilityUpdate });
        }
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
        // Auto-enable visibility settings when availability is created
        const visibilityUpdate = {};
        if (payload.bookingType === 'Video Call')
            visibilityUpdate.videoConsult = true;
        else if (payload.bookingType === 'Audio Call')
            visibilityUpdate.audioCall = true;
        else if (payload.bookingType === 'In Person')
            visibilityUpdate.inPerson = true;
        if (Object.keys(visibilityUpdate).length > 0) {
            yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, { $set: visibilityUpdate });
        }
        return {
            success: true,
            message: `Availability for ${payload.month} created successfully`,
            data: newAvailability,
        };
    }
});
exports.setAvailability = setAvailability;
const getAvailability = (query) => __awaiter(void 0, void 0, void 0, function* () {
    // Build base filter with proper ObjectId conversion
    const filter = {};
    if (query.lawyerId) {
        filter.lawyerId = new mongoose_1.Types.ObjectId(query.lawyerId);
    }
    // Fetch all matching records without pagination limit
    const data = yield availability_model_1.AvailabilityModel.find(filter).sort({ month: 1 }).lean();
    // Filter by lawyer visibility settings
    if (query.lawyerId && data.length > 0) {
        const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(query.lawyerId).lean();
        if (lawyer) {
            const filteredData = data.filter((availability) => {
                if (!availability.isActive)
                    return false;
                const bt = availability.bookingType;
                if (bt === 'Video Call' && !lawyer.videoConsult)
                    return false;
                if (bt === 'Audio Call' && !lawyer.audioCall)
                    return false;
                if (bt === 'In Person' && !lawyer.inPerson)
                    return false;
                return true;
            });
            return { data: filteredData, meta: { total: filteredData.length } };
        }
    }
    return { data, meta: { total: data.length } };
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
    const availabilities = yield availability_model_1.AvailabilityModel.find({ lawyerId: lawyer._id }).sort({ month: 1 });
    return {
        data: availabilities,
        meta: { total: availabilities.length },
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
            // Auto-enable visibility settings when availability is saved
            const visibilityUpdate = {};
            if (bookingType === 'Video Call')
                visibilityUpdate.videoConsult = true;
            else if (bookingType === 'Audio Call')
                visibilityUpdate.audioCall = true;
            else if (bookingType === 'In Person')
                visibilityUpdate.inPerson = true;
            if (Object.keys(visibilityUpdate).length > 0) {
                yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, { $set: visibilityUpdate });
            }
            return existing;
        }
        const created = yield availability_model_1.AvailabilityModel.create({ lawyerId, bookingType, month, availableDates: availableDates || [], isActive: isActive !== null && isActive !== void 0 ? isActive : true });
        yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, { $addToSet: { availability: created._id } });
        // Auto-enable visibility settings when availability is created
        const visibilityUpdate = {};
        if (bookingType === 'Video Call')
            visibilityUpdate.videoConsult = true;
        else if (bookingType === 'Audio Call')
            visibilityUpdate.audioCall = true;
        else if (bookingType === 'In Person')
            visibilityUpdate.inPerson = true;
        if (Object.keys(visibilityUpdate).length > 0) {
            yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, { $set: visibilityUpdate });
        }
        return created;
    });
}
function syncAvailabilityWithVisibility(lawyerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(lawyerId);
        if (!lawyer) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
        }
        const availabilities = yield availability_model_1.AvailabilityModel.find({ lawyerId: new mongoose_1.Types.ObjectId(lawyerId) });
        const visibilityUpdate = {};
        // Check what consultation types have availability and auto-enable them
        for (const availability of availabilities) {
            if (availability.isActive && availability.availableDates && availability.availableDates.length > 0) {
                if (availability.bookingType === 'Video Call')
                    visibilityUpdate.videoConsult = true;
                else if (availability.bookingType === 'Audio Call')
                    visibilityUpdate.audioCall = true;
                else if (availability.bookingType === 'In Person')
                    visibilityUpdate.inPerson = true;
            }
        }
        if (Object.keys(visibilityUpdate).length > 0) {
            yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyerId, { $set: visibilityUpdate });
            return { message: 'Visibility settings synced with availability', updated: visibilityUpdate };
        }
        return { message: 'No sync needed', updated: {} };
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
    syncAvailabilityWithVisibility,
};
