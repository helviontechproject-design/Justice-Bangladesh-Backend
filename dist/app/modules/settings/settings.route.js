"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const settings_controller_1 = require("./settings.controller");
const checkAuth_1 = require("../../middlewares/checkAuth");
const router = express_1.default.Router();
// Get platform settings (public - no auth required)
router.get('/', settings_controller_1.settingsController.getPlatformSettings);
// Update platform settings (super admin only)
router.patch('/', (0, checkAuth_1.checkAuth)('SUPER_ADMIN'), settings_controller_1.settingsController.updatePlatformSettings);
// One-time migration: add missing fields to existing MongoDB document
router.post('/migrate', settings_controller_1.settingsController.migrateSettings);
exports.settingsRoutes = router;
