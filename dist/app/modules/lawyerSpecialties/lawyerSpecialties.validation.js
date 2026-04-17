"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLawyerSpecialtyZod = exports.createLawyerSpecialtyZod = void 0;
const zod_1 = require("zod");
exports.createLawyerSpecialtyZod = zod_1.z.object({
    title: zod_1.z.string().trim().min(2, 'Title must be at least 2 characters').max(100, 'Title max 100 characters'),
    category: zod_1.z.string().nonempty('Category is required'),
});
exports.updateLawyerSpecialtyZod = zod_1.z.object({
    title: zod_1.z.string().trim().min(2, 'Title must be at least 2 characters').max(100, 'Title max 100 characters').optional(),
    icon: zod_1.z.string().trim().optional(),
    category: zod_1.z.string().optional(),
});
