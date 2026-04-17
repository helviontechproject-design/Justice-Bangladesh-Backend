"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    const files = req.files;
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
const deleteAppointment = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const decodedUser = req.user;
    yield appointment_service_1.appointmentService.deleteAppointment(id, decodedUser);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Appointment deleted successfully",
        data: null,
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
// Dev controller — skips SSL payment & availability check
const createAppointmentDev = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lawyerId, appointmentDate, selectedTime, appointmentType, caseType, note, videoCallingTime, totalFee } = req.body;
    const { Appointment } = yield Promise.resolve().then(() => __importStar(require('./appointment.model')));
    const { AppointmentStatus, AppointmentPaymentStatus } = yield Promise.resolve().then(() => __importStar(require('./appointment.interface')));
    const videoCallingId = `VC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const appointment = yield Appointment.create({
        lawyerId,
        videoCallingId,
        videoCallingTime: Number(videoCallingTime) || 30,
        appointmentDate: new Date(appointmentDate),
        selectedTime: selectedTime || '09:00 AM',
        appointmentType: appointmentType || 'audio',
        caseType: caseType || 'General Consultation',
        note: note || '',
        documents: [],
        status: AppointmentStatus.PENDING,
        payment_Status: AppointmentPaymentStatus.PAID,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: 'Appointment booked successfully',
        data: appointment,
    });
}));
// Dev: get all recent appointments without auth
const getMyAppointmentsDev = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { Appointment } = yield Promise.resolve().then(() => __importStar(require('./appointment.model')));
    const appointments = yield Appointment.find()
        .populate('lawyerId', 'profile_Details userId')
        .populate({ path: 'lawyerId', populate: { path: 'userId', select: 'profilePhoto' } })
        .sort({ createdAt: -1 })
        .limit(20);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Appointments fetched',
        data: appointments,
        meta: undefined,
    });
}));
exports.appointmentController = {
    createAppointment,
    createAppointmentDev,
    getAllAppointments,
    getMyAppointments,
    getMyAppointmentsDev,
    getSingleAppointment,
    updateAppointment,
    updateAppointmentStatus,
    updatePaymentStatus,
    deleteAppointment,
    getAppointmentStats,
};
