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
exports.multerUpload = void 0;
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_config_1 = require("./cloudinary.config");
const multer_1 = __importDefault(require("multer"));
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_config_1.cloudinaryUpload,
    params: (req, file) => __awaiter(void 0, void 0, void 0, function* () {
        // generate safe filename
        const fileName = file.originalname
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/\./g, '-')
            .replace(/[^a-z0-9\-\.]/g, '');
        const extension = file.originalname.split('.').pop();
        const uniqueFileName = Math.random().toString(36).substring(2) +
            '-' +
            Date.now() +
            '-' +
            fileName +
            '.' +
            extension;
        return Object.assign({ folder: 'uploads', public_id: uniqueFileName }, { resource_type: 'auto' });
    }),
});
exports.multerUpload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max file size
        files: 5, // max 5 files per request
    },
});
