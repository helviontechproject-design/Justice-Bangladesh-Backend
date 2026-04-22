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
exports.clientServices = void 0;
const client_model_1 = require("./client.model");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const constants_1 = require("../../constants");
const updateClient = (decodedUser, ClientId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield client_model_1.ClientProfileModel.findById(ClientId);
    if (!decodedUser.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are not authorized to perform this action');
    }
    if (!client) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'client not found');
    }
    const updateData = {};
    if (payload.profileInfo) {
        Object.entries(payload.profileInfo).forEach(([key, value]) => {
            updateData[`profileInfo.${key}`] = value;
        });
        delete payload.profileInfo;
    }
    Object.assign(updateData, payload);
    const updatedLawyer = yield client_model_1.ClientProfileModel.findByIdAndUpdate(ClientId, { $set: updateData }, { new: true });
    return updatedLawyer;
});
const getAllClients = (query, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (!decodedUser.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are not authorized to access this resource');
    }
    const allClients = client_model_1.ClientProfileModel.find().populate('userId', 'isActive profilePhoto phoneNo email');
    const queryBuilder = new QueryBuilder_1.QueryBuilder(allClients, query);
    const allParcels = queryBuilder
        .search(constants_1.ClientSearchableFields)
        .filter()
        .paginate();
    const [data, meta] = yield Promise.all([
        allParcels.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getClientbyid = (clientId) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield client_model_1.ClientProfileModel.findById(clientId)
        .populate('userId', 'name phoneNo email profile isActive')
        .populate({
        path: 'savedLawyers',
        select: 'userId profile_Details per_consultation_fee avarage_rating totalReviews specialties categories isOnline favorite_count',
        populate: [
            { path: 'userId', select: 'name email profile' },
            { path: 'specialties', select: 'name' },
            { path: 'categories', select: 'name slug icon' },
        ]
    });
    if (!client) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client not found');
    }
    return client;
});
const deleteClient = (clientId) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield client_model_1.ClientProfileModel.findById(clientId);
    if (!client) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client not found');
    }
    yield client_model_1.ClientProfileModel.findByIdAndDelete(clientId);
    return client;
});
const toggleSaveLawyer = (decodedUser, lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client not found');
    const alreadySaved = (_a = client.savedLawyers) === null || _a === void 0 ? void 0 : _a.some((id) => id.toString() === lawyerId);
    if (alreadySaved) {
        yield client_model_1.ClientProfileModel.findByIdAndUpdate(client._id, {
            $pull: { savedLawyers: lawyerId },
        });
        return { saved: false };
    }
    else {
        yield client_model_1.ClientProfileModel.findByIdAndUpdate(client._id, {
            $addToSet: { savedLawyers: lawyerId },
        });
        return { saved: true };
    }
});
const getSavedLawyers = (decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId })
        .populate({
        path: 'savedLawyers',
        select: 'userId profile_Details per_consultation_fee avarage_rating totalReviews specialties isOnline',
        populate: [
            { path: 'userId', select: 'profilePhoto' },
            { path: 'specialties', select: 'title' },
        ],
    });
    if (!client)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client not found');
    return (_a = client.savedLawyers) !== null && _a !== void 0 ? _a : [];
});
exports.clientServices = {
    updateClient,
    getAllClients,
    getClientbyid,
    deleteClient,
    toggleSaveLawyer,
    getSavedLawyers,
};
