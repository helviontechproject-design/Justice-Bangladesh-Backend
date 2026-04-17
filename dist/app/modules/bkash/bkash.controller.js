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
exports.bkashController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const bkash_service_1 = require("./bkash.service");
const serviceBooking_model_1 = require("../serviceBooking/serviceBooking.model");
const serviceBooking_interface_1 = require("../serviceBooking/serviceBooking.interface");
const client_model_1 = require("../client/client.model");
const service_model_1 = require("../service/service.model");
const appointment_model_1 = require("../appointment/appointment.model");
const appointment_interface_1 = require("../appointment/appointment.interface");
const payment_model_1 = require("../payment/payment.model");
const payment_interface_1 = require("../payment/payment.interface");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
function generateTrackingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SB-';
    for (let i = 0; i < 8; i++)
        code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}
// Step 1: Client initiates payment → get bKash URL
const createPayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const { serviceId } = req.body;
    const service = yield service_model_1.ServiceModel.findById(serviceId);
    if (!service)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Service not found');
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found');
    // Generate unique orderId (used as tracking reference before booking is created)
    const orderId = `ORD-${Date.now()}-${client._id.toString().slice(-4)}`;
    const bkashRes = yield bkash_service_1.BkashService.createPayment({
        amount: String(service.price || 0),
        orderId,
        merchantInvoiceNumber: orderId,
    });
    if (bkashRes.statusCode !== '0000') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, bkashRes.statusMessage || 'bKash payment init failed');
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'bKash payment initiated',
        data: {
            bkashURL: bkashRes.bkashURL,
            paymentID: bkashRes.paymentID,
            orderId,
            serviceId,
        },
    });
}));
// Step 2: bKash redirects back → execute payment & create booking
const executePayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const { paymentID, serviceId, appointmentId } = req.body;
    if (!paymentID)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'paymentID is required');
    const executeRes = yield bkash_service_1.BkashService.executePayment(paymentID);
    if (executeRes.transactionStatus !== 'Completed') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Payment not completed: ${executeRes.statusMessage}`);
    }
    // ── Appointment payment ──
    if (appointmentId) {
        const appointment = yield appointment_model_1.Appointment.findById(appointmentId);
        if (!appointment)
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Appointment not found');
        appointment.payment_Status = appointment_interface_1.AppointmentPaymentStatus.PAID;
        yield appointment.save();
        yield payment_model_1.Payment.findByIdAndUpdate(appointment.paymentId, {
            status: payment_interface_1.PaymentStatus.PAID,
            bkashPaymentID: paymentID,
            trxID: executeRes.trxID,
        });
        return (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Appointment payment successful',
            data: {
                appointmentId,
                trxID: executeRes.trxID,
                amount: executeRes.amount,
            },
        });
    }
    // ── Service booking payment ──
    const service = yield service_model_1.ServiceModel.findById(serviceId);
    if (!service)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Service not found');
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found');
    let trackingCode = generateTrackingCode();
    while (yield serviceBooking_model_1.ServiceBookingModel.findOne({ trackingCode })) {
        trackingCode = generateTrackingCode();
    }
    const booking = yield serviceBooking_model_1.ServiceBookingModel.create({
        serviceId,
        clientId: client._id,
        trackingCode,
        amount: service.price,
        status: serviceBooking_interface_1.ServiceBookingStatus.PENDING,
        paymentStatus: 'paid',
        transactionId: executeRes.trxID,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: 'Payment successful & service booked',
        data: {
            trackingCode: booking.trackingCode,
            trxID: executeRes.trxID,
            amount: executeRes.amount,
            serviceName: service.name,
        },
    });
}));
// Query payment status
const queryPayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { paymentID } = req.params;
    const result = yield bkash_service_1.BkashService.queryPayment(paymentID);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Payment status', data: result });
}));
exports.bkashController = {
    createPayment,
    executePayment,
    queryPayment,
};
