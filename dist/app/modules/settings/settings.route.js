"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const settings_controller_1 = require("./settings.controller");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const validateRequest_1 = require("../../middlewares/validateRequest");
const settings_validation_1 = require("./settings.validation");
const router = express_1.default.Router();
// Get platform settings (public - no auth required)
router.get('/', settings_controller_1.settingsController.getPlatformSettings);
// Update platform settings (admin only)
router.patch('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), (0, validateRequest_1.validateRequest)(settings_validation_1.settingsValidation.updatePlatformSettingsSchema), settings_controller_1.settingsController.updatePlatformSettings);
exports.settingsRoutes = router;
