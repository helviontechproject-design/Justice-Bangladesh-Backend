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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
class SMSService {
    constructor() {
        this.baseURL = 'http://panel.smsbangladesh.com';
        this.username = env_1.envVars.SMS_BANGLADESH.USERNAME;
        this.password = env_1.envVars.SMS_BANGLADESH.PASSWORD;
        this.senderID = env_1.envVars.SMS_BANGLADESH.SENDER_ID;
    }
    /**
     * Normalize phone number to Bangladesh format
     * Converts: +8801711111111 or 01711111111 -> 8801711111111
     */
    normalizePhone(phone) {
        let normalized = phone.trim();
        // Remove + if present
        if (normalized.startsWith('+')) {
            normalized = normalized.slice(1);
        }
        // Add 88 prefix if not present
        if (!normalized.startsWith('88')) {
            // Remove leading 0 if present
            if (normalized.startsWith('0')) {
                normalized = normalized.slice(1);
            }
            normalized = `88${normalized}`;
        }
        return normalized;
    }
    /**
     * Send OTP SMS via SMSBangladesh API
     * @param phone - Phone number (with or without country code)
     * @param otp - OTP code to send
     * @returns Promise<boolean> - true if sent successfully
     */
    sendOTP(phone, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const normalizedPhone = this.normalizePhone(phone);
                const message = `আপনার Justice Bangladesh যাচাইকরণ কোড: ${otp}\n\nএই কোডটি ৫ মিনিটের মধ্যে মেয়াদ শেষ হবে। কাউকে শেয়ার করবেন না।`;
                const response = yield axios_1.default.get(`${this.baseURL}/otp`, {
                    params: {
                        user: this.username,
                        password: this.password,
                        from: this.senderID,
                        to: normalizedPhone,
                        text: message,
                    },
                    timeout: 10000, // 10 second timeout
                });
                if (response.data.success === 1 && response.data.response_code === 100) {
                    console.log(`[SMS] OTP sent successfully to ${normalizedPhone}`);
                    return true;
                }
                else {
                    console.error(`[SMS] Failed to send OTP to ${normalizedPhone}:`, {
                        code: response.data.response_code,
                        message: response.data.message,
                    });
                    return false;
                }
            }
            catch (error) {
                console.error(`[SMS] Error sending OTP to ${phone}:`, error);
                return false;
            }
        });
    }
    /**
     * Send bulk SMS via SMSBangladesh API
     * @param phones - Array of phone numbers or comma-separated string
     * @param message - Message text to send
     * @returns Promise<boolean> - true if sent successfully
     */
    sendBulkSMS(phones, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const phoneNumbers = Array.isArray(phones)
                    ? phones.map(p => this.normalizePhone(p)).join(',')
                    : phones.split(',').map(p => this.normalizePhone(p.trim())).join(',');
                const response = yield axios_1.default.get(`${this.baseURL}/api`, {
                    params: {
                        user: this.username,
                        password: this.password,
                        from: this.senderID,
                        to: phoneNumbers,
                        text: message,
                    },
                    timeout: 15000, // 15 second timeout for bulk
                });
                if (response.data.success === 1 && response.data.response_code === 100) {
                    console.log(`[SMS] Bulk SMS sent successfully to ${phoneNumbers}`);
                    return true;
                }
                else {
                    console.error(`[SMS] Failed to send bulk SMS:`, {
                        code: response.data.response_code,
                        message: response.data.message,
                    });
                    return false;
                }
            }
            catch (error) {
                console.error('[SMS] Error sending bulk SMS:', error);
                return false;
            }
        });
    }
    /**
     * Check SMS delivery status
     * @param smsId - Unique SMS ID returned from send operation
     * @returns Promise<string | null> - Status ('SENT' or 'FAILED') or null if error
     */
    checkStatus(smsId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${this.baseURL}/smsstatus`, {
                    params: {
                        user: this.username,
                        password: this.password,
                        smsid: smsId,
                    },
                    timeout: 5000,
                });
                if (response.data.success === 1) {
                    return response.data.status || null;
                }
                return null;
            }
            catch (error) {
                console.error('[SMS] Error checking status:', error);
                return null;
            }
        });
    }
    /**
     * Check available SMS balance
     * @returns Promise<number | null> - Balance amount or null if error
     */
    checkBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${this.baseURL}/balance`, {
                    params: {
                        user: this.username,
                        password: this.password,
                    },
                    timeout: 5000,
                });
                if (response.data.response_code === 110) {
                    const balance = response.data['AVAILABLE BALANCE ='];
                    return balance ? parseFloat(balance) : null;
                }
                return null;
            }
            catch (error) {
                console.error('[SMS] Error checking balance:', error);
                return null;
            }
        });
    }
    /**
     * Check if SMS service is properly configured
     * @returns boolean - true if all credentials are set
     */
    isConfigured() {
        return !!(this.username && this.password && this.senderID);
    }
}
// Export singleton instance
exports.smsService = new SMSService();
