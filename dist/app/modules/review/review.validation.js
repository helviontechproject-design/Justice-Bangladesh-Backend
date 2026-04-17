"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReviewZod = exports.createReviewZod = void 0;
const zod_1 = require("zod");
exports.createReviewZod = zod_1.z.object({
    lawyerId: zod_1.z.string().min(1, 'Lawyer ID is required'),
    rating: zod_1.z.coerce.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    comment: zod_1.z.string().optional(),
});
exports.updateReviewZod = zod_1.z.object({
    rating: zod_1.z.coerce.number().min(1).max(5).optional(),
    comment: zod_1.z.string().optional(),
});
