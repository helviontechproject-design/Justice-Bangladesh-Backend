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
exports.payoutServices = void 0;
const payout_model_1 = require("./payout.model");
const wallet_model_1 = require("../wallet/wallet.model");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
const payout_interface_1 = require("./payout.interface");
const settings_service_1 = require("../settings/settings.service");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const notification_helper_1 = require("../notification/notification.helper");
const user_model_1 = require("../user/user.model");
const lawyer_model_1 = require("../lawyer/lawyer.model");
const requestPayout = (lawyerUserId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const lawyerProfile = yield lawyer_model_1.LawyerProfileModel.findOne({
        userId: lawyerUserId,
    });
    if (!lawyerProfile) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Lawyer not found");
    }
    const lawyerId = lawyerProfile === null || lawyerProfile === void 0 ? void 0 : lawyerProfile._id;
    // Get guide's wallet
    const wallet = yield wallet_model_1.WalletModel.findOne({ lawyerId });
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Wallet not found");
    }
    // Get platform settings for validation
    const settings = yield settings_service_1.settingsService.getPlatformSettings();
    // Check if requested amount is available
    if (payload.amount > wallet.balance) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Insufficient balance. Available: ${wallet.balance} BDT, Requested: ${payload.amount} BDT`);
    }
    // Check minimum payout amount from settings
    if (payload.amount < settings.payout.minimumAmount) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Minimum payout amount is ${settings.payout.minimumAmount} BDT`);
    }
    // Calculate platform fee and net amount
    const platformFee = yield settings_service_1.settingsService.calculatePlatformFee(payload.amount);
    const netAmount = payload.amount - platformFee;
    // Create payout request with fee breakdown
    const payout = yield payout_model_1.Payout.create(Object.assign(Object.assign({}, payload), { lawyerId,
        platformFee,
        netAmount, currency: "BDT", requestedAt: new Date() }));
    // Deduct requested amount from wallet balance (move to pending)
    wallet.balance -= payload.amount;
    wallet.payableBalance -= payload.amount;
    wallet.pendingBalance += payload.amount;
    // Track total platform fee
    wallet.totalPlatformFee = (wallet.totalPlatformFee || 0) + platformFee;
    yield wallet.save();
    // Get guide info for notification
    const guide = yield user_model_1.UserModel.findById(lawyerId).select("name");
    // Send notification to admin
    if (guide) {
        yield notification_helper_1.NotificationHelper.notifyPayoutRequested(payout, guide);
    }
    return payout;
});
const processPayout = (id, providerPayoutId) => __awaiter(void 0, void 0, void 0, function* () {
    const payout = yield payout_model_1.Payout.findById(id);
    if (!payout) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payout not found");
    }
    if (payout.status !== payout_interface_1.PayoutStatus.PENDING) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Only pending payouts can be processed");
    }
    // Get wallet to deduct from pending balance
    const wallet = yield wallet_model_1.WalletModel.findOne({ lawyerId: payout.lawyerId });
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Wallet not found");
    }
    // Update payout status
    payout.status = payout_interface_1.PayoutStatus.SENT;
    payout.processedAt = new Date();
    if (providerPayoutId) {
        payout.providerPayoutId = providerPayoutId;
    }
    yield payout.save();
    // Deduct requested amount from pending balance (not netAmount)
    wallet.pendingBalance = Math.max(0, wallet.pendingBalance - payout.amount);
    wallet.totalReceived = (wallet.totalReceived || 0) + payout.netAmount;
    yield wallet.save();
    // Note: Guide receives netAmount (amount - platformFee)
    // Platform keeps the platformFee
    // Send notification to guide
    yield notification_helper_1.NotificationHelper.notifyPayoutProcessed(payout);
    return payout;
});
const failPayout = (id, failureReason) => __awaiter(void 0, void 0, void 0, function* () {
    const payout = yield payout_model_1.Payout.findById(id);
    if (!payout) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payout not found");
    }
    if (payout.status !== payout_interface_1.PayoutStatus.PENDING) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Only pending payouts can be failed");
    }
    // Get wallet to return amount to balance
    const wallet = yield wallet_model_1.WalletModel.findOne({ lawyerId: payout.lawyerId });
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Wallet not found");
    }
    // Update payout status
    payout.status = payout_interface_1.PayoutStatus.FAILED;
    payout.failureReason = failureReason;
    payout.processedAt = new Date();
    yield payout.save();
    // Return FULL amount to balance from pending (refund platform fee too)
    wallet.balance += payout.amount;
    wallet.pendingBalance = Math.max(0, wallet.pendingBalance - payout.amount);
    // Refund platform fee since payout failed
    wallet.totalPlatformFee = Math.max(0, wallet.totalPlatformFee - payout.platformFee);
    yield wallet.save();
    // Send notification to guide
    yield notification_helper_1.NotificationHelper.notifyPayoutFailed(payout);
    return payout;
});
const cancelPayout = (id, lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    const payout = yield payout_model_1.Payout.findById(id);
    if (!payout) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payout not found");
    }
    if (payout.lawyerId.toString() !== lawyerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You can only cancel your own payouts");
    }
    if (payout.status !== payout_interface_1.PayoutStatus.PENDING) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Only pending payouts can be cancelled");
    }
    // Get wallet to return amount to balance
    const wallet = yield wallet_model_1.WalletModel.findOne({ lawyerId: payout.lawyerId });
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Wallet not found");
    }
    // Update payout status
    payout.status = payout_interface_1.PayoutStatus.CANCELLED;
    yield payout.save();
    // Return FULL amount to balance from pending (refund platform fee too)
    wallet.balance += payout.amount;
    wallet.payableBalance += payout.amount;
    wallet.pendingBalance = Math.max(0, wallet.pendingBalance - payout.amount);
    // Refund platform fee since payout cancelled
    wallet.totalPlatformFee = Math.max(0, wallet.totalPlatformFee - payout.platformFee);
    yield wallet.save();
    // Send notification to guide
    yield notification_helper_1.NotificationHelper.notifyPayoutCancelled(payout);
    return payout;
});
const getAllPayouts = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const payoutSearchableFields = [
        "paymentMethod",
        "status",
        "currency",
        "lawyerId",
    ];
    const payoutQuery = new QueryBuilder_1.QueryBuilder(payout_model_1.Payout.find().populate("lawyerId", "name email phoneNumber avatarUrl"), query)
        .search(payoutSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();
    const [data, meta] = yield Promise.all([
        payoutQuery.build().exec(),
        payoutQuery.getMeta(),
    ]);
    const statsData = yield payout_model_1.Payout.aggregate([
        {
            $group: {
                _id: "$status",
                totalAmount: { $sum: "$netAmount" },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                status: "$_id",
                totalAmount: 1,
                count: 1,
            },
        },
    ]);
    // Create dynamic default structure from enum
    const defaultStats = {};
    Object.values(payout_interface_1.PayoutStatus).forEach((status) => {
        defaultStats[status] = { totalAmount: 0, count: 0 };
    });
    // Merge aggregated values into default structure
    statsData.forEach((item) => {
        defaultStats[item.status] = {
            totalAmount: item.totalAmount,
            count: item.count,
        };
    });
    // Final stats object
    const stats = defaultStats;
    return { data, meta: Object.assign(Object.assign({}, meta), { stats }) };
});
exports.payoutServices = {
    requestPayout,
    getAllPayouts,
    processPayout,
    failPayout,
    cancelPayout,
    getMyPayouts,
};
function getMyPayouts(lawyerUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        const lawyerProfile = yield lawyer_model_1.LawyerProfileModel.findOne({ userId: lawyerUserId });
        if (!lawyerProfile)
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
        return payout_model_1.Payout.find({ lawyerId: lawyerProfile._id }).sort({ createdAt: -1 }).limit(20);
    });
}
