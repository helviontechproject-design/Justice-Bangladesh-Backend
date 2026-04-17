"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.faqRoute = void 0;
const express_1 = __importDefault(require("express"));
const faq_controller_1 = require("./faq.controller");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const router = express_1.default.Router();
router.get('/', faq_controller_1.faqController.getAll);
router.get('/admin', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), faq_controller_1.faqController.getAllAdmin);
router.post('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), faq_controller_1.faqController.create);
router.patch('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), faq_controller_1.faqController.update);
router.delete('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), faq_controller_1.faqController.remove);
exports.faqRoute = router;
