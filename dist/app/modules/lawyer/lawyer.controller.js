"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.lawyerController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const lawyer_service_1 = require("./lawyer.service");
const getPopularLawyers = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const lawyers = yield lawyer_service_1.lawyerServices.getPopularLawyers();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Popular lawyers retrieved successfully!',
        data: lawyers,
    });
}));
const getAllLawyers = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield lawyer_service_1.lawyerServices.getAllLawyers(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Data received Successfully!',
        data: user.data,
        meta: user.meta
    });
}));
const updateLawyer = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const decodedUser = req.user;
    const payload = Object.assign({}, req.body);
    // Handle file upload for bar council certificate
    if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) {
        payload.lawyerDetails = (_b = payload.lawyerDetails) !== null && _b !== void 0 ? _b : {};
        payload.lawyerDetails.bar_council_certificate = req.file.path;
    }
    const user = yield lawyer_service_1.lawyerServices.updateLawyer(decodedUser, req.params.id, payload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Lawyer profile updated successfully!',
        data: user,
    });
}));
const getLawyerbyId = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const lawyer = yield lawyer_service_1.lawyerServices.getLawyerById(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Lawyer retrieved successfully!',
        data: lawyer,
    });
}));
const saveLawyerByClient = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const { id } = req.params;
    const result = yield lawyer_service_1.lawyerServices.saveLawyerByClient(decodedUser, id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Lawyer saved successfully!',
        data: result,
    });
}));
const removeSavedLawyer = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const { id } = req.params;
    const result = yield lawyer_service_1.lawyerServices.removeSavedLawyer(decodedUser, id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Lawyer removed from saved list successfully!',
        data: result,
    });
}));
const getMySavedLawyers = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const result = yield lawyer_service_1.lawyerServices.getMySavedLawyers(decodedUser);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Saved lawyers retrieved successfully!',
        data: result,
    });
}));
// ===== ADMIN CONTROLLERS =====
const adminGetAllLawyers = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield lawyer_service_1.lawyerServices.adminGetAllLawyers(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'All lawyers retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
}));
const adminBanLawyer = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield lawyer_service_1.lawyerServices.adminBanLawyer(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Lawyer ban status toggled',
        data: result,
    });
}));
const adminVerifyLawyer = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield lawyer_service_1.lawyerServices.adminVerifyLawyer(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Lawyer verification status toggled',
        data: result,
    });
}));
const adminDeleteLawyer = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield lawyer_service_1.lawyerServices.adminDeleteLawyer(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Lawyer deleted successfully',
        data: result,
    });
}));
const adminUpdateLawyer = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Parse nested JSON strings from FormData
    const body = Object.assign({}, req.body);
    const jsonFields = ['profile_Details', 'lawyerDetails', 'specialties', 'categories', 'call_fees', 'video_fees', 'educations'];
    jsonFields.forEach((field) => {
        if (typeof body[field] === 'string') {
            try {
                body[field] = JSON.parse(body[field]);
            }
            catch (_) { }
        }
    });
    // Handle profile photo upload to Cloudinary
    if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) {
        const { LawyerProfileModel } = yield Promise.resolve().then(() => __importStar(require('../lawyer/lawyer.model')));
        const profile = yield LawyerProfileModel.findById(req.params.id).select('userId');
        if (profile === null || profile === void 0 ? void 0 : profile.userId) {
            const { UserModel } = yield Promise.resolve().then(() => __importStar(require('../user/user.model')));
            yield UserModel.findByIdAndUpdate(profile.userId, { profilePhoto: req.file.path });
        }
    }
    const result = yield lawyer_service_1.lawyerServices.adminUpdateLawyer(req.params.id, body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Lawyer updated successfully',
        data: result,
    });
}));
exports.lawyerController = {
    getPopularLawyers,
    getAllLawyers,
    updateLawyer,
    getLawyerbyId,
    saveLawyerByClient,
    removeSavedLawyer,
    getMySavedLawyers,
    // Admin
    adminGetAllLawyers,
    adminBanLawyer,
    adminVerifyLawyer,
    adminDeleteLawyer,
    adminUpdateLawyer,
};
