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
exports.broadcastController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const broadcast_service_1 = require("./broadcast.service");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const create = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const payload = Object.assign({}, req.body);
        if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path)
            payload.imageUrl = req.file.path;
        if (!payload.title) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Title is required');
        }
        const result = yield broadcast_service_1.broadcastService.createBroadcast(payload);
        (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.CREATED, message: 'Broadcast created', data: result });
    }
    catch (error) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to create broadcast');
    }
}));
const send = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield broadcast_service_1.broadcastService.sendBroadcast(req.params.id);
        (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Broadcast sent to all users', data: result });
    }
    catch (error) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to send broadcast');
    }
}));
const getAll = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield broadcast_service_1.broadcastService.getAllBroadcasts();
        (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Broadcasts fetched', data: result });
    }
    catch (error) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to fetch broadcasts');
    }
}));
const update = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const payload = Object.assign({}, req.body);
        if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path)
            payload.imageUrl = req.file.path;
        if (!payload.title) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Title is required');
        }
        const result = yield broadcast_service_1.broadcastService.updateBroadcast(req.params.id, payload);
        (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Broadcast updated', data: result });
    }
    catch (error) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to update broadcast');
    }
}));
const remove = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield broadcast_service_1.broadcastService.deleteBroadcast(req.params.id);
        (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Broadcast deleted', data: null });
    }
    catch (error) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to delete broadcast');
    }
}));
exports.broadcastController = { create, send, getAll, update, remove };
