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
exports.lawyerSpecialtyService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const lawyerSpecialties_model_1 = require("./lawyerSpecialties.model");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const mongoose_1 = __importDefault(require("mongoose"));
const lawyer_model_1 = require("../lawyer/lawyer.model");
// ── Public ───────────────────────────────────────────────────────────────────
const getAllLawyerSpecialties = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const specialties = lawyerSpecialties_model_1.LawyerSpecialty.find().populate('category');
    const queryBuilder = new QueryBuilder_1.QueryBuilder(specialties, query);
    const result = queryBuilder.search(['title']).filter().paginate();
    const [data, meta] = yield Promise.all([result.build().exec(), queryBuilder.getMeta()]);
    return { data, meta };
});
const getSingleLawyerSpecialty = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const specialty = yield lawyerSpecialties_model_1.LawyerSpecialty.findById(id).populate('category');
    if (!specialty)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Specialty not found');
    return specialty;
});
/** GET /lawyer-specialties/by-category/:categoryId */
const getByCategory = (categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    return lawyerSpecialties_model_1.LawyerSpecialty.find({ category: categoryId })
        .populate('category', 'name slug')
        .sort({ title: 1 });
});
/** GET /lawyer-specialties/suggest?q=keyword — case-insensitive, limit 10 */
const suggestSpecialties = (q) => __awaiter(void 0, void 0, void 0, function* () {
    if (!q || q.trim().length < 1)
        return [];
    return lawyerSpecialties_model_1.LawyerSpecialty.find({ title: { $regex: q.trim(), $options: 'i' } })
        .select('title icon category')
        .populate('category', 'name')
        .limit(10)
        .sort({ title: 1 });
});
// ── Lawyer (self) ────────────────────────────────────────────────────────────
const createLawyerSpecialty = (decodedUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!decodedUser.userId)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({ userId: decodedUser.userId });
    if (!lawyer)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer profile not found');
    const existing = yield lawyerSpecialties_model_1.LawyerSpecialty.findOne({ title: payload.title, category: payload.category });
    if (existing && ((_a = lawyer.specialties) === null || _a === void 0 ? void 0 : _a.some(s => s.toString() === existing._id.toString()))) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You already added this specialty');
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const [specialty] = yield lawyerSpecialties_model_1.LawyerSpecialty.create([payload], { session });
        yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyer._id, { $addToSet: { specialties: specialty._id } }, { session });
        yield session.commitTransaction();
        session.endSession();
        return lawyerSpecialties_model_1.LawyerSpecialty.findById(specialty._id).populate('category');
    }
    catch (err) {
        yield session.abortTransaction();
        session.endSession();
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed: ${err}`);
    }
});
const updateLawyerSpecialty = (id, decodedUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const specialty = yield lawyerSpecialties_model_1.LawyerSpecialty.findById(id);
    if (!specialty)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Specialty not found');
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({ userId: decodedUser.userId });
    if (!lawyer)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
    if (!((_a = lawyer.specialties) === null || _a === void 0 ? void 0 : _a.some(s => s.toString() === specialty._id.toString()))) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You can only update your own specialties');
    }
    return lawyerSpecialties_model_1.LawyerSpecialty.findByIdAndUpdate(id, payload, { new: true }).populate('category');
});
const deleteLawyerSpecialty = (id, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const specialty = yield lawyerSpecialties_model_1.LawyerSpecialty.findById(id);
    if (!specialty)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Specialty not found');
    if (decodedUser.role === 'LAWYER') {
        const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({ userId: decodedUser.userId });
        if (!lawyer)
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
        if (!((_a = lawyer.specialties) === null || _a === void 0 ? void 0 : _a.some(s => s.toString() === specialty._id.toString()))) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You can only delete your own specialties');
        }
        yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(lawyer._id, { $pull: { specialties: specialty._id } });
    }
    else {
        yield lawyer_model_1.LawyerProfileModel.updateMany({ specialties: specialty._id }, { $pull: { specialties: specialty._id } });
    }
    yield lawyerSpecialties_model_1.LawyerSpecialty.findByIdAndDelete(id);
});
const getMySpecialties = (decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (!decodedUser.userId)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({ userId: decodedUser.userId })
        .populate({ path: 'specialties', populate: { path: 'category' } });
    if (!lawyer)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
    return lawyer.specialties || [];
});
// ── Admin ────────────────────────────────────────────────────────────────────
/** Admin creates a global specialization linked to a category */
const adminCreateSpecialty = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload.title || !payload.category) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Title and category are required');
    }
    const exists = yield lawyerSpecialties_model_1.LawyerSpecialty.findOne({ title: { $regex: `^${payload.title}$`, $options: 'i' }, category: payload.category });
    if (exists)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Specialization already exists in this category');
    return lawyerSpecialties_model_1.LawyerSpecialty.create({
        title: payload.title,
        category: payload.category,
        icon: payload.icon || '',
    });
});
const adminUpdateSpecialty = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const specialty = yield lawyerSpecialties_model_1.LawyerSpecialty.findById(id);
    if (!specialty)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Specialty not found');
    return lawyerSpecialties_model_1.LawyerSpecialty.findByIdAndUpdate(id, payload, { new: true }).populate('category');
});
const adminDeleteSpecialty = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const specialty = yield lawyerSpecialties_model_1.LawyerSpecialty.findById(id);
    if (!specialty)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Specialty not found');
    yield lawyer_model_1.LawyerProfileModel.updateMany({ specialties: specialty._id }, { $pull: { specialties: specialty._id } });
    yield lawyerSpecialties_model_1.LawyerSpecialty.findByIdAndDelete(id);
});
exports.lawyerSpecialtyService = {
    getAllLawyerSpecialties,
    getSingleLawyerSpecialty,
    getByCategory,
    suggestSpecialties,
    createLawyerSpecialty,
    updateLawyerSpecialty,
    deleteLawyerSpecialty,
    getMySpecialties,
    adminCreateSpecialty,
    adminUpdateSpecialty,
    adminDeleteSpecialty,
};
