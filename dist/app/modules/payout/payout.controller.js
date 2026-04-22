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
exports.payoutController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const payout_service_1 = require("./payout.service");
const payout_model_1 = require("./payout.model");
const wallet_model_1 = require("../wallet/wallet.model");
const payout_interface_1 = require("./payout.interface");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const requestPayout = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const lawyerUserId = req.user.userId;
    const result = yield payout_service_1.payoutServices.requestPayout(lawyerUserId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: "Payout requested successfully",
        data: result,
    });
}));
const processPayout = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const providerPayoutId = (_a = req.body) === null || _a === void 0 ? void 0 : _a.providerPayoutId;
    const result = yield payout_service_1.payoutServices.processPayout(id, providerPayoutId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Payout processed successfully",
        data: result,
    });
}));
const failPayout = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { failureReason } = req.body;
    const result = yield payout_service_1.payoutServices.failPayout(id, failureReason);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Payout marked as failed",
        data: result,
    });
}));
const cancelPayout = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const lawyerUserId = req.user.userId;
    const { reason } = req.body;
    const result = yield payout_service_1.payoutServices.cancelPayout(id, lawyerUserId, reason);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Payout cancelled successfully",
        data: result,
    });
}));
const getAllPayouts = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield payout_service_1.payoutServices.getAllPayouts(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "All payouts retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const getMyPayouts = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const lawyerUserId = req.user.userId;
    const result = yield payout_service_1.payoutServices.getMyPayouts(lawyerUserId);
    (0, sendResponse_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.OK, success: true, message: 'My payouts retrieved', data: result });
}));
const adminCancelPayout = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { reason } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
    const payout = yield payout_model_1.Payout.findById(id);
    if (!payout)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Payout not found');
    if (!['PENDING', 'PROCESSING'].includes(payout.status)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only pending or processing payouts can be cancelled');
    }
    const wallet = yield wallet_model_1.WalletModel.findOne({ lawyerId: payout.lawyerId });
    payout.status = payout_interface_1.PayoutStatus.CANCELLED;
    if (reason)
        payout.failureReason = reason;
    yield payout.save();
    if (wallet) {
        wallet.balance += payout.amount;
        wallet.payableBalance += payout.amount;
        wallet.pendingBalance = Math.max(0, wallet.pendingBalance - payout.amount);
        wallet.totalPlatformFee = Math.max(0, wallet.totalPlatformFee - payout.platformFee);
        yield wallet.save();
    }
    (0, sendResponse_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.OK, success: true, message: 'Payout cancelled by admin', data: payout });
}));
exports.payoutController = {
    requestPayout,
    getAllPayouts,
    processPayout,
    failPayout,
    cancelPayout,
    getMyPayouts,
    adminCancelPayout,
};
