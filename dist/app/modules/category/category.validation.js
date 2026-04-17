"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategoryZ = exports.categoryZ = void 0;
const zod_1 = require("zod");
const booleanField = zod_1.z.union([zod_1.z.boolean(), zod_1.z.string().transform((v) => v === 'true')]);
exports.categoryZ = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, 'name at least 2 chars')
        .max(100, 'name max 100 chars'),
    slug: zod_1.z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'invalid slug (use lower-case letters, numbers and hyphens)')
        .optional(),
    imageUrl: zod_1.z.string().url('invalid url').optional(),
    isFeatured: booleanField.optional(),
    isActive: booleanField.optional(),
    consultationFee: zod_1.z.union([zod_1.z.number(), zod_1.z.string().transform(Number)]).optional(),
});
exports.updateCategoryZ = exports.categoryZ.partial();
