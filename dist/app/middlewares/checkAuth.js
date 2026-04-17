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
exports.checkAuth = void 0;
const env_1 = require("../config/env");
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const jwt_1 = require("../utils/jwt");
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = require("../modules/user/user.model");
const user_interface_1 = require("../modules/user/user.interface");
const checkAuth = (...authRole) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        let accessToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken) || ((_b = req.headers) === null || _b === void 0 ? void 0 : _b.authorization);
        // Extract token from "Bearer <token>" format
        if (accessToken && accessToken.startsWith('Bearer ')) {
            accessToken = accessToken.slice(7); // Remove "Bearer " prefix
        }
        if ((_c = req === null || req === void 0 ? void 0 : req.body) === null || _c === void 0 ? void 0 : _c.token) {
            accessToken = req.body.token;
        }
        if (!accessToken) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'No Token Received');
        }
        const decodedToken = (0, jwt_1.verifyToken)(accessToken, env_1.envVars.JWT_ACCESS_SECRET);
        const isUserExist = yield user_model_1.UserModel.findById(decodedToken.userId);
        if (!isUserExist) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User does not exist');
        }
        if (isUserExist.isActive === user_interface_1.EIsActive.BLOCKED ||
            isUserExist.isActive === user_interface_1.EIsActive.INACTIVE) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `User is ${isUserExist.isActive}`);
        }
        if (isUserExist.isDeleted) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User is deleted');
        }
        if (!authRole.includes(isUserExist.role)) {
            throw new AppError_1.default(403, 'You are not permitted to view this route!!!');
        }
        req.user = decodedToken;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.checkAuth = checkAuth;
