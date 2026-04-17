"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceZ = exports.serviceZ = void 0;
const zod_1 = require("zod");
exports.serviceZ = zod_1.z.object({
    name: zod_1.z.string().min(2, 'name at least 2 chars').max(100, 'name max 100 chars'),
    slug: zod_1.z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'invalid slug').optional(),
    price: zod_1.z.coerce.number().min(0).optional(),
    imageUrl: zod_1.z.string().url('invalid url').optional(),
    isFeatured: zod_1.z.coerce.boolean().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
});
exports.updateServiceZ = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    slug: zod_1.z.string().optional(),
    price: zod_1.z.coerce.number().min(0).optional(),
    imageUrl: zod_1.z.string().optional(),
    isFeatured: zod_1.z.coerce.boolean().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
});
