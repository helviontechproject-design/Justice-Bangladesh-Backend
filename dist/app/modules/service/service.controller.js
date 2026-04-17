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
exports.serviceController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const service_service_1 = require("./service.service");
const createService = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const decodedUser = req.user;
    const files = req.files;
    const payload = Object.assign(Object.assign({}, req.body), { imageUrl: ((_b = (_a = files === null || files === void 0 ? void 0 : files['image']) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.path) || ((_c = req.file) === null || _c === void 0 ? void 0 : _c.path), iconUrl: (_e = (_d = files === null || files === void 0 ? void 0 : files['icon']) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.path });
    const result = yield service_service_1.serviceServices.createService(payload, decodedUser);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: 'Service created successfully',
        data: result,
    });
}));
const getAllCategories = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_service_1.serviceServices.getAllCategories();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Categories retrieved successfully',
        data: result,
    });
}));
const getFeaturedServices = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_service_1.serviceServices.getFeaturedServices();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Featured services retrieved successfully',
        data: result,
    });
}));
const getSingleService = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield service_service_1.serviceServices.getSingleService(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Service retrieved successfully',
        data: result,
    });
}));
const updateService = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const decodedUser = req.user;
    const { id } = req.params;
    const files = req.files;
    const payload = Object.assign({}, req.body);
    if ((_b = (_a = files === null || files === void 0 ? void 0 : files['image']) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.path)
        payload.imageUrl = files['image'][0].path;
    else if ((_c = req.file) === null || _c === void 0 ? void 0 : _c.path)
        payload.imageUrl = req.file.path;
    if ((_e = (_d = files === null || files === void 0 ? void 0 : files['icon']) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.path)
        payload.iconUrl = files['icon'][0].path;
    const result = yield service_service_1.serviceServices.updateService(id, payload, decodedUser);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Service updated successfully',
        data: result,
    });
}));
const deleteService = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const { id } = req.params;
    yield service_service_1.serviceServices.deleteService(id, decodedUser);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Service deleted successfully',
        data: null,
    });
}));
exports.serviceController = {
    createService,
    getAllCategories,
    getFeaturedServices,
    getSingleService,
    updateService,
    deleteService,
};
