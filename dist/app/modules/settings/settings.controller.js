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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const settings_service_1 = require("./settings.service");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
// Get platform settings (public)
const getPlatformSettings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield settings_service_1.settingsService.getPlatformSettings();
    // Force ensure duration field exists in API response (fallback approach)
    const responseData = Object.assign(Object.assign({}, result), { instantConsultancyDuration: Number(result.instantConsultancyDuration) || 10, instantConsultancyNotice: String(result.instantConsultancyNotice || '') });
    console.log('🔧 Final response data:', JSON.stringify(responseData, null, 2));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Platform settings retrieved successfully',
        data: responseData,
    });
}));
// Update platform settings (admin only)
const updatePlatformSettings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body || Object.keys(req.body).length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Request body cannot be empty');
    }
    // Remove MongoDB metadata fields if present
    const _a = req.body, { _id, __v, createdAt, updatedAt } = _a, updatePayload = __rest(_a, ["_id", "__v", "createdAt", "updatedAt"]);
    const result = yield settings_service_1.settingsService.updatePlatformSettings(updatePayload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Platform settings updated successfully',
        data: result,
    });
}));
// One-time migration: add missing fields to existing MongoDB document
const migrateSettings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield settings_service_1.settingsService.migrateSettings();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Migration completed',
        data: result,
    });
}));
exports.settingsController = {
    getPlatformSettings,
    updatePlatformSettings,
    migrateSettings,
};
