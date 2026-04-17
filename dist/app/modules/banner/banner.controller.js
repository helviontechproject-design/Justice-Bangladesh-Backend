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
exports.bannerController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const banner_service_1 = require("./banner.service");
const createBanner = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const decodedUser = req.user;
    const payload = Object.assign(Object.assign({}, req.body), { ImageUrl: (_a = req.file) === null || _a === void 0 ? void 0 : _a.path });
    const banner = yield banner_service_1.bannerService.createBanner(payload, decodedUser);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `Banner Created successfully`,
        data: banner,
    });
}));
const updateBanner = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const decodedUser = req.user;
    const payload = Object.assign({}, req.body);
    if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) {
        payload.ImageUrl = req.file.path;
    }
    const banner = yield banner_service_1.bannerService.updateBanner(req.params.id, payload, decodedUser);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `Banner Updated successfully`,
        data: banner,
    });
}));
const getAllBanners = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const banner = yield banner_service_1.bannerService.getAllBanners(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `Banners fetched successfully`,
        data: banner,
    });
}));
const deleteBanner = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedUser = req.user;
    const banner = yield banner_service_1.bannerService.deleteBanner(req.params.id, decodedUser);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `Banner Deleted successfully`,
        data: null,
    });
}));
exports.bannerController = {
    createBanner,
    updateBanner,
    getAllBanners,
    deleteBanner,
};
