"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentStatus = exports.PaymentType = void 0;
var PaymentType;
(function (PaymentType) {
    PaymentType["BOOKING_FEE"] = "booking_fee";
    PaymentType["PAYOUT"] = "payout";
    PaymentType["REFUND"] = "refund";
    PaymentType["TOP_UP"] = "top_up";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["UNPAID"] = "UNPAID";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
