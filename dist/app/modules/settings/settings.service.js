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
    return settings;
});
// Update platform settings (admin only)
const updatePlatformSettings = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    let settings = yield settings_model_1.PlatformSettings.findOne();
    if (!settings) {
        // Create if doesn't exist
        settings = yield settings_model_1.PlatformSettings.create(payload);
    }
    else {
        // Update existing settings using deep merge for nested objects
        if (payload.platformFee) {
            settings.platformFee = Object.assign(Object.assign({}, settings.platformFee), payload.platformFee);
        }
        if (payload.payout) {
            settings.payout = Object.assign(Object.assign({}, settings.payout), payload.payout);
        }
        if (payload.payment) {
            settings.payment = Object.assign(Object.assign({}, settings.payment), payload.payment);
        }
        if (payload.general) {
            settings.general = Object.assign(Object.assign({}, settings.general), payload.general);
        }
        if (payload.socialLinks) {
            settings.socialLinks = Object.assign(Object.assign({}, settings.socialLinks), payload.socialLinks);
        }
        if (payload.contacts) {
            settings.contacts = Object.assign(Object.assign({}, settings.contacts), payload.contacts);
        }
        if (payload.seo) {
            settings.seo = Object.assign(Object.assign({}, settings.seo), payload.seo);
        }
        if (payload.whatsapp) {
            settings.whatsapp = Object.assign(Object.assign({}, settings.whatsapp), payload.whatsapp);
        }
        if (payload.homePageCards) {
            settings.homePageCards = {
                instantConsultationCard: {
                    image: (_e = (_b = (_a = payload.homePageCards.instantConsultationCard) === null || _a === void 0 ? void 0 : _a.image) !== null && _b !== void 0 ? _b : (_d = (_c = settings.homePageCards) === null || _c === void 0 ? void 0 : _c.instantConsultationCard) === null || _d === void 0 ? void 0 : _d.image) !== null && _e !== void 0 ? _e : '',
                },
                popularSpecialistCard: {
                    image: (_k = (_g = (_f = payload.homePageCards.popularSpecialistCard) === null || _f === void 0 ? void 0 : _f.image) !== null && _g !== void 0 ? _g : (_j = (_h = settings.homePageCards) === null || _h === void 0 ? void 0 : _h.popularSpecialistCard) === null || _j === void 0 ? void 0 : _j.image) !== null && _k !== void 0 ? _k : '',
                },
            };
        }
        yield settings.save();
    }
    return settings;
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
exports.settingsService = {
    getPlatformSettings,
    updatePlatformSettings,
    calculatePlatformFee,
};
