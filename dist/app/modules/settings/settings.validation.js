"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsValidation = void 0;
const zod_1 = require("zod");
// Home Page Cards Schema - Allow empty strings or valid URLs
const homePageCardsSchema = zod_1.z.object({
    instantConsultationCard: zod_1.z.object({
        image: zod_1.z.string()
            .refine((val) => val === '' || val.startsWith('http://') || val.startsWith('https://'), { message: 'Image must be empty or a valid URL' })
            .optional(),
    }).optional(),
    popularSpecialistCard: zod_1.z.object({
        image: zod_1.z.string()
            .refine((val) => val === '' || val.startsWith('http://') || val.startsWith('https://'), { message: 'Image must be empty or a valid URL' })
            .optional(),
    }).optional(),
}).optional();
// Very lenient schema that accepts any payload but validates homePageCards if present
const updatePlatformSettingsSchema = zod_1.z.object({
    homePageCards: homePageCardsSchema,
}).passthrough();
exports.settingsValidation = {
    updatePlatformSettingsSchema,
};
