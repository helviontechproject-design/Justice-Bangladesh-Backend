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
exports.statsController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const stats_service_1 = require("./stats.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const lawyer_model_1 = require("../lawyer/lawyer.model");
const client_model_1 = require("../client/client.model");
const getAdminStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const stats = yield stats_service_1.statsService.getAdminDashboardStats(query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Admin statistics retrieved successfully',
        data: stats,
    });
}));
const getLawyerStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized user');
    }
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({ userId: user.userId });
    const lawyerId = lawyer === null || lawyer === void 0 ? void 0 : lawyer._id;
    if (!lawyerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer profile not found for this user');
    }
    const query = req.query;
    const stats = yield stats_service_1.statsService.getLawyerDashboardStats(lawyerId.toString(), query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Lawyer statistics retrieved successfully',
        data: stats,
    });
}));
const getClientStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized user');
    }
    const Client = yield client_model_1.ClientProfileModel.findOne({ userId: user.userId });
    if (!Client) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found for this user');
    }
    const clientId = Client._id;
    if (!clientId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found for this user');
    }
    const query = req.query;
    const stats = yield stats_service_1.statsService.getClientDashboardStats(clientId.toString(), query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Client statistics retrieved successfully',
        data: stats,
    });
}));
exports.statsController = {
    getAdminStats,
    getLawyerStats,
    getClientStats,
};
