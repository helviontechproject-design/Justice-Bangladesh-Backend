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
exports.walletService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const wallet_model_1 = require("./wallet.model");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const mongoose_1 = require("mongoose");
const lawyer_model_1 = require("../lawyer/lawyer.model");
const getAllWallets = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const wallets = wallet_model_1.WalletModel.find()
        .populate('lawyerId', '_id userId profile_Details gender')
        .populate('transactions');
    const queryBuilder = new QueryBuilder_1.QueryBuilder(wallets, query);
    const allWallets = queryBuilder
        .filter()
        .sort()
        .paginate();
    const [data, meta] = yield Promise.all([
        allWallets.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getMyWallet = (decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (!decodedUser.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized user');
    }
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({ userId: decodedUser.userId });
    if (!lawyer) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer profile not found');
    }
    const wallet = yield wallet_model_1.WalletModel.findOne({ lawyerId: lawyer._id });
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Wallet not found');
    }
    return wallet;
});
const getWalletById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.WalletModel.findById(id)
        .populate('lawyerId', '_id userId profile_Details')
        .populate('transactions');
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Wallet not found');
    }
    return wallet;
});
const getWalletByLawyerId = (lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.WalletModel.findOne({
        lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
    })
        .populate('lawyerId', '_id userId profile_Details')
        .populate('transactions');
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Wallet not found for this lawyer');
    }
    return wallet;
});
const updateWallet = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.WalletModel.findById(id);
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Wallet not found');
    }
    const updatedWallet = yield wallet_model_1.WalletModel.findByIdAndUpdate(id, payload, { new: true }).populate('lawyerId').populate('transactions');
    return updatedWallet;
});
exports.walletService = {
    getAllWallets,
    getMyWallet,
    getWalletById,
    getWalletByLawyerId,
    updateWallet
};
