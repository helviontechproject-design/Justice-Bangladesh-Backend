"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Video = void 0;
const mongoose_1 = require("mongoose");
const videoSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    youtubeLink: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.Video = (0, mongoose_1.model)('Video', videoSchema);
