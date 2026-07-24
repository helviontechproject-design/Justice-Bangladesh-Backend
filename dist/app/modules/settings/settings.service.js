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
        settings = yield settings_model_1.PlatformSettings.create({
            instantConsultancyDuration: 10,
        });
    }
    // Convert to plain object and force add missing fields
    const settingsObj = settings.toObject();
    // Always ensure these fields exist in response
    if (settingsObj.instantConsultancyDuration === undefined || settingsObj.instantConsultancyDuration === null || typeof settingsObj.instantConsultancyDuration !== 'number') {
        settingsObj.instantConsultancyDuration = 10;
    }
    if (settingsObj.instantConsultancyNotice === undefined || settingsObj.instantConsultancyNotice === null) {
        settingsObj.instantConsultancyNotice = '';
    }
    return settingsObj;
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
        // Always persist both fields
        if ('instantConsultancyNotice' in payload) {
            sanitized['instantConsultancyNotice'] = (_a = payload.instantConsultancyNotice) !== null && _a !== void 0 ? _a : '';
        }
        if ('instantConsultancyDuration' in payload) {
            const duration = payload.instantConsultancyDuration;
            sanitized['instantConsultancyDuration'] = (typeof duration === 'number' && duration >= 5 && duration <= 60) ? duration : 10;
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
    console.log('🔧 Starting migration process...');
    // Try to find existing settings
    let settings = yield settings_model_1.PlatformSettings.findOne();
    console.log('Current settings found:', !!settings);
    if (!settings) {
        console.log('🔧 Creating new settings document with all fields');
        settings = yield settings_model_1.PlatformSettings.create({
            instantConsultancyNotice: '',
            instantConsultancyDuration: 10,
        });
        return { migrated: true, fields: ['created new document with all fields'] };
    }
    // Force add the duration field using raw MongoDB update
    const result = yield settings_model_1.PlatformSettings.updateOne({ _id: settings._id }, {
        $set: {
            instantConsultancyDuration: 10,
            instantConsultancyNotice: settings.instantConsultancyNotice || ''
        }
    });
    console.log('🔧 Direct MongoDB update result:', result);
    // Verify the update worked
    const updated = yield settings_model_1.PlatformSettings.findById(settings._id);
    console.log('✅ After update - duration field:', updated === null || updated === void 0 ? void 0 : updated.instantConsultancyDuration);
    return {
        migrated: true,
        fields: ['forcefully added instantConsultancyDuration']
    };
});
exports.settingsService = {
    getPlatformSettings,
    updatePlatformSettings,
    calculatePlatformFee,
    migrateSettings,
};
