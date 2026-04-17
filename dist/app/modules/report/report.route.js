"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoute = void 0;
const express_1 = __importDefault(require("express"));
const report_controller_1 = require("./report.controller");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const router = express_1.default.Router();
router.post('/', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), report_controller_1.reportController.create);
router.get('/my', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), report_controller_1.reportController.getMyReports);
router.get('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), report_controller_1.reportController.getAll);
router.patch('/:id/reply', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), report_controller_1.reportController.reply);
exports.reportRoute = router;
