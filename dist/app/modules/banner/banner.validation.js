"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBannerZod = exports.createBannerZod = void 0;
const zod_1 = require("zod");
const booleanField = zod_1.z.union([zod_1.z.boolean(), zod_1.z.string().transform((v) => v === 'true')]);
exports.createBannerZod = zod_1.z.object({
    isActive: booleanField.optional().default(true),
    target: zod_1.z.enum(['client', 'lawyer', 'all']).optional().default('all'),
});
exports.updateBannerZod = zod_1.z.object({
    isActive: booleanField.optional(),
    target: zod_1.z.enum(['client', 'lawyer', 'all']).optional(),
});
