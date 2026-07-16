"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsValidation = void 0;
const zod_1 = require("zod");
// Very lenient schema - accepts any payload without strict validation
const updatePlatformSettingsSchema = zod_1.z.object({}).passthrough();
exports.settingsValidation = {
    updatePlatformSettingsSchema,
};
