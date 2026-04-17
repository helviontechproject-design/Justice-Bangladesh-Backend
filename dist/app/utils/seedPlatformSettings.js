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
exports.seedPlatformSettings = void 0;
const settings_model_1 = require("../modules/settings/settings.model");
const seedPlatformSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settingsExist = yield settings_model_1.PlatformSettings.findOne();
        if (settingsExist) {
            console.log('Platform settings already exist!');
            return;
        }
        const defaultSettings = {
            platformFee: {
                percentage: 15,
                type: 'PERCENTAGE',
                enabled: true,
            },
            payout: {
                minimumAmount: 1000,
                processingDays: 7,
                maxPendingPayouts: 5,
            },
            payment: {
                currency: 'BDT',
                taxPercentage: 0,
                gateway: 'SSLCOMMERZ',
            },
            general: {
                platformName: 'lawfirm',
                supportEmail: 'support@lawfirm.com',
                supportPhone: '+8801791732611',
                maintenanceMode: false,
                allowNewGuideRegistrations: true,
            },
            socialLinks: {
                facebook: 'https://facebook.com/lawfirm',
                twitter: 'https://twitter.com/lawfirm',
                instagram: 'https://instagram.com/lawfirm',
                linkedin: 'https://linkedin.com/company/lawfirm',
                youtube: 'https://youtube.com/@lawfirm',
            },
            contacts: {
                address: 'Dhaka, Bangladesh',
                phone: '+8801791732611',
                email: 'contact@lawfirm.com',
                supportEmail: 'support@lawfirm.com',
                supportPhone: '+8801791732611',
                businessHours: 'Saturday - Thursday: 9:00 AM - 6:00 PM',
            },
            seo: {
                metaTitle: 'lawfirm - Find Your Perfect Lawyer',
                metaDescription: 'Connect with experienced Lawyers and get expert legal advice. Hire the best legal professionals for your needs.',
                metaKeywords: 'lawfirm, lawyer, legal advice, hire lawyer, legal services, attorney, law consultant',
            },
        };
        yield settings_model_1.PlatformSettings.create(defaultSettings);
        console.log('Platform settings seeded successfully!');
    }
    catch (error) {
        console.log('Error seeding platform settings:', error);
    }
});
exports.seedPlatformSettings = seedPlatformSettings;
