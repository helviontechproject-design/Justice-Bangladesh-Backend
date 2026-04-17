"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsValidation = void 0;
const zod_1 = require("zod");
const updatePlatformSettingsSchema = zod_1.z
    .object({
    platformFee: zod_1.z
        .object({
        percentage: zod_1.z.number().min(0).max(100).optional(),
        type: zod_1.z.enum(['PERCENTAGE', 'FIXED']).optional(),
        enabled: zod_1.z.boolean().optional(),
    })
        .partial()
        .optional(),
    payout: zod_1.z
        .object({
        minimumAmount: zod_1.z.number().min(0).optional(),
        processingDays: zod_1.z.number().min(1).optional(),
        maxPendingPayouts: zod_1.z.number().min(1).optional(),
    })
        .partial()
        .optional(),
    payment: zod_1.z
        .object({
        currency: zod_1.z.string().optional(),
        taxPercentage: zod_1.z.number().min(0).max(100).optional(),
        gateway: zod_1.z.enum(['SSLCOMMERZ', 'STRIPE', 'BOTH']).optional(),
    })
        .partial()
        .optional(),
    general: zod_1.z
        .object({
        platformName: zod_1.z.string().optional(),
        supportEmail: zod_1.z.string().email().optional(),
        supportPhone: zod_1.z.string().optional(),
        maintenanceMode: zod_1.z.boolean().optional(),
        allowNewGuideRegistrations: zod_1.z.boolean().optional(),
    })
        .partial()
        .optional(),
    socialLinks: zod_1.z
        .object({
        facebook: zod_1.z.string().optional(),
        twitter: zod_1.z.string().optional(),
        instagram: zod_1.z.string().optional(),
        linkedin: zod_1.z.string().optional(),
        youtube: zod_1.z.string().optional(),
    })
        .partial()
        .optional(),
    contacts: zod_1.z
        .object({
        address: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        supportEmail: zod_1.z.string().email().optional(),
        supportPhone: zod_1.z.string().optional(),
        businessHours: zod_1.z.string().optional(),
    })
        .partial()
        .optional(),
    seo: zod_1.z
        .object({
        metaTitle: zod_1.z.string().optional(),
        metaDescription: zod_1.z.string().optional(),
        metaKeywords: zod_1.z.string().optional(),
    })
        .partial()
        .optional(),
    whatsapp: zod_1.z
        .object({
        clientNumber: zod_1.z.string().optional(),
        lawyerNumber: zod_1.z.string().optional(),
    })
        .partial()
        .optional(),
})
    .partial();
exports.settingsValidation = {
    updatePlatformSettingsSchema,
};
