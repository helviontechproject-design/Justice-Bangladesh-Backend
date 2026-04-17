"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentPaymentStatus = exports.AppointmentStatus = exports.AppointmentType = void 0;
var AppointmentType;
(function (AppointmentType) {
    AppointmentType["AUDIO"] = "audio";
    AppointmentType["VIDEO"] = "video";
    AppointmentType["IN_PERSON"] = "in-person";
})(AppointmentType || (exports.AppointmentType = AppointmentType = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "pending";
    AppointmentStatus["CONFIRMED"] = "confirmed";
    AppointmentStatus["COMPLETED"] = "completed";
    AppointmentStatus["CANCELLED"] = "cancelled";
    AppointmentStatus["REJECTED"] = "rejected";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var AppointmentPaymentStatus;
(function (AppointmentPaymentStatus) {
    AppointmentPaymentStatus["PAID"] = "PAID";
    AppointmentPaymentStatus["UNPAID"] = "UNPAID";
    AppointmentPaymentStatus["REJECT"] = "REJECT";
})(AppointmentPaymentStatus || (exports.AppointmentPaymentStatus = AppointmentPaymentStatus = {}));
