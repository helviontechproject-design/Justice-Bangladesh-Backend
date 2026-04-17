"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LawyerSpecialty = void 0;
const mongoose_1 = require("mongoose");
const lawyerSpecialtySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    icon: {
        type: String,
        required: false,
        trim: true,
    },
    category: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'Category',
        required: true,
    },
}, {
    timestamps: true,
});
exports.LawyerSpecialty = (0, mongoose_1.model)('LawyerSpecialty', lawyerSpecialtySchema);
