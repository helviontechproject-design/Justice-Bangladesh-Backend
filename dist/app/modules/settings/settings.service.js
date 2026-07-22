"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = void 0;
const settings_model_1 = require("./settings.model");
// Get platform settings (always returns one document)
const getPlatformSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    let settings = yield settings_model_1.PlatformSettings.findOne();
    // If no settings exist, create default settings
    if (!settings) {
        settings = yield settings_model_1.PlatformSettings.create({});
    }
    // Ensure new fields exist on legacy documents (migration-safe)
    const needsUpdate = {};
    if (settings.instantConsultancyNotice === undefined) {
        needsUpdate['instantConsultancyNotice'] = '';
    }
    if (Object.keys(needsUpdate).length > 0) {
        yield settings_model_1.PlatformSettings.findByIdAndUpdate(settings._id, { $set: needsUpdate });
        settings = (yield settings_model_1.PlatformSettings.findById(settings._id));
    }
    return settings;
});
// Update platform settings (admin only)
const updatePlatformSettings = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let settings = yield settings_model_1.PlatformSettings.findOne();
        if (!settings) {
            settings = yield settings_model_1.PlatformSettings.create(payload);
            return settings;
        }
        // Sanitize payload — remove undefined values so $set doesn't skip them
        const sanitized = {};
        for (const [key, value] of Object.entries(payload)) {
            if (value !== undefined) {
                sanitized[key] = value;
            }
        }
        // Always persist instantConsultancyNotice even if empty string
        if ('instantConsultancyNotice' in payload) {
            sanitized['instantConsultancyNotice'] = (_a = payload.instantConsultancyNotice) !== null && _a !== void 0 ? _a : '';
        }
        const updatedSettings = yield settings_model_1.PlatformSettings.findByIdAndUpdate(settings._id, { $set: sanitized }, { new: true, runValidators: false });
        return updatedSettings || settings;
    }
    catch (error) {
        console.error('Settings update error:', error.message);
        console.error('Full error:', error);
        throw error;
    }
});
// Calculate platform fee based on amount
const calculatePlatformFee = (amount) => __awaiter(void 0, void 0, void 0, function* () {
    const settings = yield getPlatformSettings();
    // If platform fee is disabled, return 0
    if (!settings.platformFee.enabled) {
        return 0;
    }
    // Calculate based on type
    if (settings.platformFee.type === 'PERCENTAGE') {
        return (amount * settings.platformFee.percentage) / 100;
    }
    // For FIXED type (future implementation)
    return settings.platformFee.percentage; // Use percentage field as fixed amount
});
// One-time migration: ensure all new fields exist in MongoDB document
const migrateSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    const settings = yield settings_model_1.PlatformSettings.findOne();
    if (!settings) {
        yield settings_model_1.PlatformSettings.create({});
        return { migrated: true, fields: ['created new document'] };
    }
    const updates = {};
    const fields = [];
    if (settings.instantConsultancyNotice === undefined || settings.instantConsultancyNotice === null) {
        updates['instantConsultancyNotice'] = '';
        fields.push('instantConsultancyNotice');
    }
    if (fields.length === 0) {
        return { migrated: false, fields: [] };
    }
    yield settings_model_1.PlatformSettings.findByIdAndUpdate(settings._id, { $set: updates }, { runValidators: false });
    return { migrated: true, fields };
});
exports.settingsService = {
    getPlatformSettings,
    updatePlatformSettings,
    calculatePlatformFee,
    migrateSettings,
};
