"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutStatus = void 0;
var PayoutStatus;
(function (PayoutStatus) {
    PayoutStatus["PENDING"] = "PENDING";
    PayoutStatus["PROCESSING"] = "PROCESSING";
    PayoutStatus["SENT"] = "SENT";
    PayoutStatus["FAILED"] = "FAILED";
    PayoutStatus["CANCELLED"] = "CANCELLED";
})(PayoutStatus || (exports.PayoutStatus = PayoutStatus = {}));
