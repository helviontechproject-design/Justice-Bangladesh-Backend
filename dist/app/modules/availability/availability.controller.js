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
exports.availabilityController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const availability_service_1 = require("./availability.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const setAvailability = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const Availability = yield availability_service_1.availabilityService.setAvailability(decodedUser, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `${Availability.message}`,
        data: Availability.data,
    });
}));
const getAvailability = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const Availability = yield availability_service_1.availabilityService.getAvailability(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `Availability fetched successfully`,
        data: Availability.data,
        meta: Availability.meta,
    });
}));
const getAvailabilityById = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const availability = yield availability_service_1.availabilityService.getAvailabilityById(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `Availability fetched successfully`,
        data: availability,
    });
}));
const deleteAvailability = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const decodedUser = req.user;
    yield availability_service_1.availabilityService.deleteAvailability(id, decodedUser);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `Availability deleted successfully`,
        data: null,
    });
}));
const getMyAvailability = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const availability = yield availability_service_1.availabilityService.getMyAvailability(decodedUser, req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `Your availability fetched successfully`,
        data: availability.data,
        meta: availability.meta,
    });
}));
const getAvailabilityByLawyerId = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield availability_service_1.availabilityService.getAvailabilityByLawyerId(req.params.lawyerId);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Availability fetched', data });
}));
const adminSetAvailability = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield availability_service_1.availabilityService.adminSetAvailability(req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Availability saved', data });
}));
exports.availabilityController = {
    setAvailability,
    getAvailability,
    getAvailabilityById,
    deleteAvailability,
    getMyAvailability,
    getAvailabilityByLawyerId,
    adminSetAvailability,
};
