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
exports.serviceServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const service_model_1 = require("./service.model");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
// ✅ Create Service
const createService = (payload, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    const Service = yield service_model_1.ServiceModel.create(payload);
    return Service;
});
// ✅ Get all
const getAllCategories = () => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield service_model_1.ServiceModel.find({ isActive: true }).sort({ createdAt: -1 });
    return categories;
});
// ✅ Get featured (max 8)
const getFeaturedServices = () => __awaiter(void 0, void 0, void 0, function* () {
    const services = yield service_model_1.ServiceModel.find({ isActive: true, isFeatured: true })
        .sort({ createdAt: -1 })
        .limit(8);
    return services;
});
// ✅ Get single
const getSingleService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const Service = yield service_model_1.ServiceModel.findOne({
        $or: [{ _id: id }, { slug: id }],
    });
    if (!Service) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Service not found');
    }
    return Service;
});
// ✅ Update
const updateService = (id, payload, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    const Service = yield service_model_1.ServiceModel.findById(id);
    if (!Service) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Service not found');
    }
    const updated = yield service_model_1.ServiceModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    return updated;
});
// ✅ Delete
const deleteService = (id, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    const Service = yield service_model_1.ServiceModel.findById(id);
    if (!Service) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Service not found');
    }
    yield service_model_1.ServiceModel.findByIdAndDelete(id);
    return Service;
});
exports.serviceServices = {
    createService,
    getAllCategories,
    getFeaturedServices,
    getSingleService,
    updateService,
    deleteService,
};
