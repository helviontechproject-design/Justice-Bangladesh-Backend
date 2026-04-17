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
exports.blogService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const blog_model_1 = require("./blog.model");
const createBlog = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return blog_model_1.Blog.create(payload);
});
const getAllBlogs = () => __awaiter(void 0, void 0, void 0, function* () {
    return blog_model_1.Blog.find({ isActive: true }).sort({ createdAt: -1 });
});
const getAllBlogsAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    return blog_model_1.Blog.find().sort({ createdAt: -1 });
});
const updateBlog = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const blog = yield blog_model_1.Blog.findById(id);
    if (!blog)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Blog not found');
    return blog_model_1.Blog.findByIdAndUpdate(id, payload, { new: true });
});
const deleteBlog = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const blog = yield blog_model_1.Blog.findById(id);
    if (!blog)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Blog not found');
    return blog_model_1.Blog.findByIdAndDelete(id);
});
exports.blogService = { createBlog, getAllBlogs, getAllBlogsAdmin, updateBlog, deleteBlog };
