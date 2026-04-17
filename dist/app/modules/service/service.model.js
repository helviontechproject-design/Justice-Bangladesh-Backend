"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceModel = void 0;
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
const ServiceSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    price: {
        type: Number,
        required: false,
        default: 0,
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        index: true,
    },
    description: {
        type: String,
        required: false,
        trim: true,
    },
    iconUrl: {
        type: String,
        required: false,
        trim: true,
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
ServiceSchema.pre('validate', function (next) {
    const doc = this;
    if (!doc.slug && doc.name) {
        doc.slug = slugify(doc.name);
    }
    next();
});
exports.ServiceModel = (0, mongoose_1.model)('Service', ServiceSchema);
