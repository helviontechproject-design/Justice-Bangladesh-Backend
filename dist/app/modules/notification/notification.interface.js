"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPriority = exports.NotificationType = void 0;
var NotificationType;
(function (NotificationType) {
    // Booking Events
    NotificationType["BOOKING_CREATED"] = "BOOKING_CREATED";
    NotificationType["BOOKING_CONFIRMED"] = "BOOKING_CONFIRMED";
    NotificationType["BOOKING_DECLINED"] = "BOOKING_DECLINED";
    NotificationType["BOOKING_CANCELLED"] = "BOOKING_CANCELLED";
    NotificationType["BOOKING_COMPLETED"] = "BOOKING_COMPLETED";
    // Payment Events
    NotificationType["PAYMENT_SUCCESS"] = "PAYMENT_SUCCESS";
    NotificationType["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    NotificationType["PAYMENT_REFUNDED"] = "PAYMENT_REFUNDED";
    // Review Events
    NotificationType["REVIEW_RECEIVED_TOUR"] = "REVIEW_RECEIVED_TOUR";
    NotificationType["REVIEW_RECEIVED_LAWYER"] = "REVIEW_RECEIVED_LAWYER";
    // Payout Events
    NotificationType["PAYOUT_REQUESTED"] = "PAYOUT_REQUESTED";
    NotificationType["PAYOUT_PROCESSED"] = "PAYOUT_PROCESSED";
    NotificationType["PAYOUT_FAILED"] = "PAYOUT_FAILED";
    NotificationType["PAYOUT_CANCELLED"] = "PAYOUT_CANCELLED";
    // User/Account Events
    NotificationType["ACCOUNT_VERIFIED"] = "ACCOUNT_VERIFIED";
    NotificationType["ACCOUNT_STATUS_CHANGED"] = "ACCOUNT_STATUS_CHANGED";
    NotificationType["PASSWORD_RESET_SUCCESS"] = "PASSWORD_RESET_SUCCESS";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["MEDIUM"] = "MEDIUM";
    NotificationPriority["HIGH"] = "HIGH";
    NotificationPriority["URGENT"] = "URGENT";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
