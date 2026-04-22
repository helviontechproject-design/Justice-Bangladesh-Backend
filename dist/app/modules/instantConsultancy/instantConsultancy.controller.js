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
exports.instantConsultancyController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const instantConsultancy_service_1 = require("./instantConsultancy.service");
const initPayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    // Upload documents if any
    const files = req.files || [];
    let documentUrls = [];
    if (files.length > 0) {
        documentUrls = yield instantConsultancy_service_1.instantConsultancyService.uploadDocuments(files);
    }
    const result = yield instantConsultancy_service_1.instantConsultancyService.initPayment(decodedUser, Object.assign(Object.assign({}, req.body), { documentUrls }));
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'bKash payment initiated', data: result });
}));
const createRequest = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const files = req.files || [];
    let documentUrls = [];
    if (files.length > 0) {
        documentUrls = yield instantConsultancy_service_1.instantConsultancyService.uploadDocuments(files);
    }
    const result = yield instantConsultancy_service_1.instantConsultancyService.createRequest(decodedUser, Object.assign(Object.assign({}, req.body), { documentUrls }));
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.CREATED, message: 'Request created. Notifying available lawyers...', data: result });
}));
const acceptRequest = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const result = yield instantConsultancy_service_1.instantConsultancyService.acceptRequest(decodedUser, req.params.requestId);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Request accepted. Starting call...', data: result });
}));
const getPendingForLawyer = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const result = yield instantConsultancy_service_1.instantConsultancyService.getPendingForLawyer(decodedUser);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Pending request', data: result });
}));
const getRequestStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield instantConsultancy_service_1.instantConsultancyService.getRequestStatus(req.params.requestId);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Request status', data: result });
}));
const cancelRequest = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const result = yield instantConsultancy_service_1.instantConsultancyService.cancelRequest(decodedUser, req.params.requestId);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Request cancelled', data: result });
}));
const adminGetAll = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield instantConsultancy_service_1.instantConsultancyService.adminGetAll();
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'All requests', data: result });
}));
const getSettings = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield instantConsultancy_service_1.instantConsultancyService.getSettings();
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Settings', data: result });
}));
const updateSettings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield instantConsultancy_service_1.instantConsultancyService.updateSettings(req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Settings updated', data: result });
}));
// Items
const createItem = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield instantConsultancy_service_1.instantConsultancyService.createItem(req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.CREATED, message: 'Item created', data: result });
}));
const getItems = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield instantConsultancy_service_1.instantConsultancyService.getItems();
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Items', data: result });
}));
const getAllItems = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield instantConsultancy_service_1.instantConsultancyService.getAllItems();
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'All items', data: result });
}));
const updateItem = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield instantConsultancy_service_1.instantConsultancyService.updateItem(req.params.id, req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Item updated', data: result });
}));
const deleteItem = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield instantConsultancy_service_1.instantConsultancyService.deleteItem(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Item deleted', data: result });
}));
exports.instantConsultancyController = {
    initPayment,
    createRequest,
    acceptRequest,
    getPendingForLawyer,
    getRequestStatus,
    cancelRequest,
    adminGetAll,
    getSettings,
    updateSettings,
    createItem,
    getItems,
    getAllItems,
    updateItem,
    deleteItem,
};
