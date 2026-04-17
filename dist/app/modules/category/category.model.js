"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryModel = void 0;
const mongoose_1 = require("mongoose");
function slugify(s) {
    return s
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/\-+/g, '-')
        .replace(/^\-+|\-+$/g, '');
}
const categorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        index: true,
    },
    imageUrl: {
        type: String,
        required: false,
        trim: true,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});
categorySchema.pre('validate', function (next) {
    const doc = this;
    if (!doc.slug && doc.name) {
        doc.slug = slugify(doc.name);
    }
    next();
});
exports.CategoryModel = (0, mongoose_1.model)('Category', categorySchema);
exports.default = exports.CategoryModel;
