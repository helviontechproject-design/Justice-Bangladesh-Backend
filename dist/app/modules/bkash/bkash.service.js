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
exports.BkashService = void 0;
const axios_1 = __importDefault(require("axios"));
// bKash Checkout URL API base
const BASE_URL = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
let _token = null;
let _tokenExpiry = 0;
// Get grant token (cached, refreshed when expired)
const getToken = () => __awaiter(void 0, void 0, void 0, function* () {
    if (_token && Date.now() < _tokenExpiry)
        return _token;
    const res = yield axios_1.default.post(`${BASE_URL}/tokenized/checkout/token/grant`, {
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET,
    }, {
        headers: {
            'Content-Type': 'application/json',
            username: process.env.BKASH_USERNAME,
            password: process.env.BKASH_PASSWORD,
        },
    });
    const resData = res.data;
    _token = resData.id_token;
    // expires in 3600s, refresh 60s early
    _tokenExpiry = Date.now() + (resData.expires_in - 60) * 1000;
    return _token;
});
// Create payment — returns bKash payment URL
const createPayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield getToken();
    const res = yield axios_1.default.post(`${BASE_URL}/tokenized/checkout/create`, {
        mode: '0011',
        payerReference: payload.orderId,
        callbackURL: `${process.env.BKASH_CALLBACK_URL}?orderId=${payload.orderId}`,
        amount: payload.amount,
        currency: payload.currency || 'BDT',
        intent: payload.intent || 'sale',
        merchantInvoiceNumber: payload.merchantInvoiceNumber || payload.orderId,
    }, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: token,
            'X-APP-Key': process.env.BKASH_APP_KEY,
        },
    });
    return res.data; // contains bkashURL, paymentID, statusCode
});
// Execute payment after user completes on bKash
const executePayment = (paymentID) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield getToken();
    const res = yield axios_1.default.post(`${BASE_URL}/tokenized/checkout/execute`, { paymentID }, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: token,
            'X-APP-Key': process.env.BKASH_APP_KEY,
        },
    });
    return res.data; // contains trxID, transactionStatus, amount
});
// Query payment status
const queryPayment = (paymentID) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield getToken();
    const res = yield axios_1.default.post(`${BASE_URL}/tokenized/checkout/payment/status`, { paymentID }, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: token,
            'X-APP-Key': process.env.BKASH_APP_KEY,
        },
    });
    return res.data;
});
// Refund
const refundPayment = (paymentID, trxID, amount, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield getToken();
    const res = yield axios_1.default.post(`${BASE_URL}/tokenized/checkout/payment/refund`, { paymentID, trxID, amount, currency: 'BDT', reason }, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: token,
            'X-APP-Key': process.env.BKASH_APP_KEY,
        },
    });
    return res.data;
});
exports.BkashService = {
    getToken,
    createPayment,
    executePayment,
    queryPayment,
    refundPayment,
};
