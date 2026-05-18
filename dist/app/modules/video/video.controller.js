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
exports.videoController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const video_service_1 = require("./video.service");
const createVideo = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield video_service_1.videoService.createVideo(req.body);
    (0, sendResponse_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.CREATED, success: true, message: 'Video created', data });
}));
const getAllVideos = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield video_service_1.videoService.getAllVideos();
    (0, sendResponse_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.OK, success: true, message: 'Videos fetched', data });
}));
const getAllVideosAdmin = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield video_service_1.videoService.getAllVideosAdmin();
    (0, sendResponse_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.OK, success: true, message: 'Videos fetched', data });
}));
const updateVideo = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield video_service_1.videoService.updateVideo(req.params.id, req.body);
    (0, sendResponse_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.OK, success: true, message: 'Video updated', data });
}));
const deleteVideo = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield video_service_1.videoService.deleteVideo(req.params.id);
    (0, sendResponse_1.default)(res, { statusCode: http_status_codes_1.StatusCodes.OK, success: true, message: 'Video deleted', data });
}));
exports.videoController = { createVideo, getAllVideos, getAllVideosAdmin, updateVideo, deleteVideo };
