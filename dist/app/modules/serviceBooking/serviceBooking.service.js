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
exports.serviceBookingService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const service_model_1 = require("../service/service.model");
const client_model_1 = require("../client/client.model");
const serviceBooking_model_1 = require("./serviceBooking.model");
const serviceBooking_interface_1 = require("./serviceBooking.interface");
function generateTrackingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'APP-';
    for (let i = 0; i < 8; i++)
        code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}
const createApplication = (decodedUser, serviceId, transactionId, applicantName, applicantPhone, documents) => __awaiter(void 0, void 0, void 0, function* () {
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
        transactionId,
        applicantName,
        applicantPhone,
        documents,
    });
    return booking;
});
const trackApplication = (trackingCode) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield serviceBooking_model_1.ServiceBookingModel.findOne({ trackingCode })
        .populate('serviceId', 'name imageUrl price');
    if (!booking)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Application not found');
    return booking;
});
const getMyApplications = (decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found');
    return serviceBooking_model_1.ServiceBookingModel.find({ clientId: client._id })
        .populate('serviceId', 'name imageUrl price')
        .sort({ createdAt: -1 });
});
const adminGetAllApplications = () => __awaiter(void 0, void 0, void 0, function* () {
    return serviceBooking_model_1.ServiceBookingModel.find()
        .populate('serviceId', 'name price')
        .populate('clientId', 'profileInfo')
        .sort({ createdAt: -1 });
});
const adminGetSingleApplication = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const app = yield serviceBooking_model_1.ServiceBookingModel.findById(id)
        .populate('serviceId', 'name price imageUrl')
        .populate('clientId', 'profileInfo');
    if (!app)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Application not found');
    return app;
});
const adminUpdateStatus = (id, status, rejectReason) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield serviceBooking_model_1.ServiceBookingModel.findById(id);
    if (!booking)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Application not found');
    booking.status = status;
    if (status === serviceBooking_interface_1.ServiceBookingStatus.REJECTED && rejectReason) {
        booking.rejectReason = rejectReason;
    }
    yield booking.save();
    return booking;
});
const getServiceStats = (serviceId) => __awaiter(void 0, void 0, void 0, function* () {
    const total = yield serviceBooking_model_1.ServiceBookingModel.countDocuments({ serviceId });
    const avgRating = 0; // from reviews
    return { total, avgRating };
});
exports.serviceBookingService = {
    createApplication,
    trackApplication,
    getMyApplications,
    adminGetAllApplications,
    adminGetSingleApplication,
    adminUpdateStatus,
    getServiceStats,
};
