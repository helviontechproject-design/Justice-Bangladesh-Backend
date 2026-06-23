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
exports.appointmentController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const appointment_service_1 = require("./appointment.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const createAppointment = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const files = ((_a = req.files) !== null && _a !== void 0 ? _a : {});
    const decodedUser = req.user;
    const payload = Object.assign(Object.assign({}, req.body), { documents: files["documents"]
            ? files["documents"].map((f) => f.path)
            : [] });
    const appointment = yield appointment_service_1.appointmentService.createAppointment(decodedUser, payload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: "Appointment created successfully",
        data: appointment,
    });
}));
const getAllAppointments = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield appointment_service_1.appointmentService.getAllAppointments(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Appointments fetched successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const getMyAppointments = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const result = yield appointment_service_1.appointmentService.getMyAppointments(decodedUser, req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Your appointments fetched successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const getSingleAppointment = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const decodedUser = req.user;
    const appointment = yield appointment_service_1.appointmentService.getSingleAppointment(id, decodedUser);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Appointment fetched successfully",
        data: appointment,
    });
}));
const updateAppointment = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const decodedUser = req.user;
    const appointment = yield appointment_service_1.appointmentService.updateAppointment(id, decodedUser, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Appointment updated successfully",
        data: appointment,
    });
}));
const updateAppointmentStatus = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    const decodedUser = req.user;
    const appointment = yield appointment_service_1.appointmentService.updateAppointmentStatus(id, decodedUser, status, req);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Appointment status updated successfully",
        data: appointment,
    });
}));
const updatePaymentStatus = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const appointment = yield appointment_service_1.appointmentService.updatePaymentStatus(id, paymentStatus);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Payment status updated successfully",
        data: appointment,
    });
}));
const rescheduleAppointment = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { newDate, newTime } = req.body;
    const decodedUser = req.user;
    const appointment = yield appointment_service_1.appointmentService.rescheduleAppointment(id, decodedUser, newDate, newTime);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Appointment rescheduled successfully",
        data: appointment,
    });
}));
const cancelAppointmentWithRefund = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { reason } = req.body;
    const decodedUser = req.user;
    const result = yield appointment_service_1.appointmentService.cancelAppointmentWithRefund(id, decodedUser, reason);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: result.message,
        data: {
            appointment: result.appointment,
            refundAmount: result.refundAmount,
            refundPercentage: result.refundPercentage,
        },
    });
}));
const deleteAppointment = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const decodedUser = req.user;
    // For now, redirect to cancel with refund
    const result = yield appointment_service_1.appointmentService.cancelAppointmentWithRefund(id, decodedUser, 'Appointment deleted by user');
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Appointment deleted successfully",
        data: result,
    });
}));
const getAppointmentStats = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield appointment_service_1.appointmentService.getAppointmentStats();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Appointment statistics fetched successfully",
        data: stats,
    });
}));
exports.appointmentController = {
    createAppointment,
    getAllAppointments,
    getMyAppointments,
    getSingleAppointment,
    updateAppointment,
    updateAppointmentStatus,
    updatePaymentStatus,
    rescheduleAppointment,
    cancelAppointmentWithRefund,
    deleteAppointment,
    getAppointmentStats,
};
