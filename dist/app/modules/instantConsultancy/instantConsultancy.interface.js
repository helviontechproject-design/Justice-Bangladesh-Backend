"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTANT_CONSULTATION_FEE = exports.InstantConsultancyStatus = void 0;
var InstantConsultancyStatus;
(function (InstantConsultancyStatus) {
    InstantConsultancyStatus["WAITING"] = "waiting";
    InstantConsultancyStatus["ACCEPTED"] = "accepted";
    InstantConsultancyStatus["ONGOING"] = "ongoing";
    InstantConsultancyStatus["COMPLETED"] = "completed";
    InstantConsultancyStatus["CANCELLED"] = "cancelled";
    InstantConsultancyStatus["EXPIRED"] = "expired";
})(InstantConsultancyStatus || (exports.InstantConsultancyStatus = InstantConsultancyStatus = {}));
exports.INSTANT_CONSULTATION_FEE = 500; // BDT
