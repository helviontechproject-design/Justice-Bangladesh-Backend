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
exports.clientController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const client_service_1 = require("./client.service");
const user_model_1 = require("../user/user.model");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const updateClient = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const payload = Object.assign({}, req.body);
    const user = yield client_service_1.clientServices.updateClient(decodedUser, req.params.id, payload);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Data received Successfully!', data: user });
}));
const getAllClients = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const user = yield client_service_1.clientServices.getAllClients(req.query, decodedUser);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Data received Successfully!', data: user });
}));
const getClientbyid = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield client_service_1.clientServices.getClientbyid(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Client retrieved successfully!', data: client });
}));
const banClient = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield client_service_1.clientServices.getClientbyid(req.params.userId);
    if (!client)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client not found');
    const userId = typeof client.userId === 'object' ? client.userId._id : client.userId;
    yield user_model_1.UserModel.findByIdAndUpdate(userId, { isActive: 'BLOCKED' });
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Client banned successfully', data: null });
}));
const unbanClient = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield client_service_1.clientServices.getClientbyid(req.params.userId);
    if (!client)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client not found');
    const userId = typeof client.userId === 'object' ? client.userId._id : client.userId;
    yield user_model_1.UserModel.findByIdAndUpdate(userId, { isActive: 'ACTIVE' });
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Client unbanned successfully', data: null });
}));
const deleteClient = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield client_service_1.clientServices.deleteClient(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Client deleted successfully', data: null });
}));
const toggleSaveLawyer = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const result = yield client_service_1.clientServices.toggleSaveLawyer(decodedUser, req.params.lawyerId);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: result.saved ? 'Lawyer saved' : 'Lawyer unsaved', data: result });
}));
const getSavedLawyers = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const result = yield client_service_1.clientServices.getSavedLawyers(decodedUser);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Saved lawyers fetched', data: result });
}));
exports.clientController = {
    updateClient,
    getAllClients,
    getClientbyid,
    banClient,
    unbanClient,
    deleteClient,
    toggleSaveLawyer,
    getSavedLawyers,
};
