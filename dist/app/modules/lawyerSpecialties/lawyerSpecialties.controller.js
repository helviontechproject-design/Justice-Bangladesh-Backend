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
exports.lawyerSpecialtyController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const lawyerSpecialties_service_1 = require("./lawyerSpecialties.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const createLawyerSpecialty = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const specialty = yield lawyerSpecialties_service_1.lawyerSpecialtyService.createLawyerSpecialty(req.user, Object.assign(Object.assign({}, req.body), { icon: (_a = req.file) === null || _a === void 0 ? void 0 : _a.path }));
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.CREATED, message: 'Specialty created', data: specialty });
}));
const getAllLawyerSpecialties = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield lawyerSpecialties_service_1.lawyerSpecialtyService.getAllLawyerSpecialties(req.query);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Specialties fetched', data: result.data, meta: result.meta });
}));
const getSingleLawyerSpecialty = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const specialty = yield lawyerSpecialties_service_1.lawyerSpecialtyService.getSingleLawyerSpecialty(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Specialty fetched', data: specialty });
}));
const updateLawyerSpecialty = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const payload = Object.assign(Object.assign({}, req.body), (((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) && { icon: req.file.path }));
    const specialty = yield lawyerSpecialties_service_1.lawyerSpecialtyService.updateLawyerSpecialty(req.params.id, req.user, payload);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Specialty updated', data: specialty });
}));
const deleteLawyerSpecialty = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield lawyerSpecialties_service_1.lawyerSpecialtyService.deleteLawyerSpecialty(req.params.id, req.user);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Specialty deleted', data: null });
}));
const getMySpecialties = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const specialties = yield lawyerSpecialties_service_1.lawyerSpecialtyService.getMySpecialties(req.user);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Your specialties', data: specialties });
}));
/** GET /lawyer-specialties/by-category/:categoryId */
const getByCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield lawyerSpecialties_service_1.lawyerSpecialtyService.getByCategory(req.params.categoryId);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Specialties by category', data });
}));
/** GET /lawyer-specialties/suggest?q=keyword */
const suggestSpecialties = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const q = req.query.q || '';
    const data = yield lawyerSpecialties_service_1.lawyerSpecialtyService.suggestSpecialties(q);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Suggestions', data });
}));
/** Admin: POST /lawyer-specialties/admin/create */
const adminCreateSpecialty = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = yield lawyerSpecialties_service_1.lawyerSpecialtyService.adminCreateSpecialty({
        title: req.body.title,
        category: req.body.category,
        icon: ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) || req.body.icon || '',
    });
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.CREATED, message: 'Specialization created', data });
}));
/** Admin: PUT /lawyer-specialties/admin/:id */
const adminUpdateSpecialty = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield lawyerSpecialties_service_1.lawyerSpecialtyService.adminUpdateSpecialty(req.params.id, req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Specialization updated', data });
}));
/** Admin: DELETE /lawyer-specialties/admin/:id */
const adminDeleteSpecialty = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield lawyerSpecialties_service_1.lawyerSpecialtyService.adminDeleteSpecialty(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_codes_1.StatusCodes.OK, message: 'Specialization deleted', data: null });
}));
exports.lawyerSpecialtyController = {
    createLawyerSpecialty,
    getAllLawyerSpecialties,
    getSingleLawyerSpecialty,
    updateLawyerSpecialty,
    deleteLawyerSpecialty,
    getMySpecialties,
    getByCategory,
    suggestSpecialties,
    adminCreateSpecialty,
    adminUpdateSpecialty,
    adminDeleteSpecialty,
};
