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
exports.serviceBookingController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const serviceBooking_service_1 = require("./serviceBooking.service");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const createApplication = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const { serviceId, transactionId, applicantName, applicantPhone, documents } = req.body;
    // documents from body (already uploaded URLs) or from files
    let docList = [];
    if (req.files && Array.isArray(req.files)) {
        const labels = JSON.parse(req.body.documentLabels || '[]');
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const result = yield (0, cloudinary_config_1.uploadBufferToCloudinary)(file.buffer, 'service-docs');
            docList.push({
                label: labels[i] || `Document ${i + 1}`,
                url: result.secure_url,
                originalName: file.originalname,
            });
        }
    }
    else if (documents) {
        docList = typeof documents === 'string' ? JSON.parse(documents) : documents;
    }
    const result = yield serviceBooking_service_1.serviceBookingService.createApplication(decodedUser, serviceId, transactionId, applicantName, applicantPhone, docList);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.CREATED, message: 'Application submitted successfully', data: result });
}));
const trackApplication = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield serviceBooking_service_1.serviceBookingService.trackApplication(req.params.trackingCode);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Application found', data: result });
}));
const getMyApplications = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const result = yield serviceBooking_service_1.serviceBookingService.getMyApplications(decodedUser);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'My applications', data: result });
}));
const adminGetAllApplications = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield serviceBooking_service_1.serviceBookingService.adminGetAllApplications();
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'All applications', data: result });
}));
const adminGetSingleApplication = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield serviceBooking_service_1.serviceBookingService.adminGetSingleApplication(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Application details', data: result });
}));
const adminUpdateStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, rejectReason } = req.body;
    const result = yield serviceBooking_service_1.serviceBookingService.adminUpdateStatus(req.params.id, status, rejectReason);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Status updated', data: result });
}));
const getServiceStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield serviceBooking_service_1.serviceBookingService.getServiceStats(req.params.serviceId);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Service stats', data: result });
}));
exports.serviceBookingController = {
    createApplication,
    trackApplication,
    getMyApplications,
    adminGetAllApplications,
    adminGetSingleApplication,
    adminUpdateStatus,
    getServiceStats,
};
