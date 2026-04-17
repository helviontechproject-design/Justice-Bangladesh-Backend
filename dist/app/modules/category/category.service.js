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
exports.categoryServices = void 0;
const category_model_1 = __importDefault(require("./category.model"));
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const createCategory = (payload, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    const userCheck = yield category_model_1.default.findById(decodedUser.userId);
    if (userCheck) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Category already exists');
    }
    const category = yield category_model_1.default.create(payload);
    return category;
});
const getAllCategories = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = category_model_1.default.find();
    const queryBuilder = new QueryBuilder_1.QueryBuilder(categories, query);
    const allCategories = queryBuilder.filter().sort().paginate();
    const [data, meta] = yield Promise.all([
        allCategories.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getSingleCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield category_model_1.default.findOne({
        $or: [{ _id: id }, { slug: id }],
    });
    if (!category) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Category not found');
    }
    return category;
});
const updateCategory = (id, payload, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield category_model_1.default.findById(id);
    if (!category) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Category not found');
    }
    const updated = yield category_model_1.default.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    return updated;
});
const deleteCategory = (id, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield category_model_1.default.findById(id);
    if (!category) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Category not found');
    }
    yield category_model_1.default.findByIdAndDelete(id);
    return category;
});
exports.categoryServices = {
    createCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    deleteCategory,
};
