"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceBookingStatus = void 0;
var ServiceBookingStatus;
(function (ServiceBookingStatus) {
    ServiceBookingStatus["PENDING"] = "pending";
    ServiceBookingStatus["PROCESSING"] = "processing";
    ServiceBookingStatus["COMPLETED"] = "completed";
    ServiceBookingStatus["CANCELLED"] = "cancelled";
    ServiceBookingStatus["REJECTED"] = "rejected";
})(ServiceBookingStatus || (exports.ServiceBookingStatus = ServiceBookingStatus = {}));
