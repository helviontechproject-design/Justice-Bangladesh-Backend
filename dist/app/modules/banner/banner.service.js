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
exports.bannerService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_interface_1 = require("../user/user.interface");
const banner_model_1 = require("./banner.model");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const createBanner = (payload, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedUser.role !== user_interface_1.ERole.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only admin can create banners!");
    }
    const result = yield banner_model_1.Banner.create(payload);
    return result;
});
const updateBanner = (id, payload, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    const banner = yield banner_model_1.Banner.findById(id);
    if (!banner) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Banner not found!');
    }
    if (decodedUser.role !== user_interface_1.ERole.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Only admin can update banners!');
    }
    const result = yield banner_model_1.Banner.findByIdAndUpdate(id, payload, { new: true });
    return result;
});
const getAllBanners = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = { isActive: true };
    if (query.target && query.target !== 'all') {
        filter.$or = [
            { target: query.target },
            { target: 'all' },
            { target: { $exists: false } }, // old banners without target field
        ];
    }
    const banners = banner_model_1.Banner.find(filter);
    const queryBuilder = new QueryBuilder_1.QueryBuilder(banners, query);
    const allBanners = queryBuilder.paginate();
    const [data, meta] = yield Promise.all([
        allBanners.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return { data, meta };
});
const deleteBanner = (id, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedUser.role !== user_interface_1.ERole.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Only admin can delete banners!');
    }
    const banner = yield banner_model_1.Banner.findById(id);
    if (!banner) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Banner not found');
    }
    const result = yield banner_model_1.Banner.findByIdAndDelete(id);
    return result;
});
exports.bannerService = {
    createBanner,
    updateBanner,
    getAllBanners,
    deleteBanner,
};
