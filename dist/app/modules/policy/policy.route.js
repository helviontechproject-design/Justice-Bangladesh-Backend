"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyRoute = void 0;
const express_1 = __importDefault(require("express"));
const policy_controller_1 = require("./policy.controller");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const router = express_1.default.Router();
router.get('/', policy_controller_1.policyController.get);
router.get('/all', policy_controller_1.policyController.getAll);
router.put('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), policy_controller_1.policyController.upsert);
exports.policyRoute = router;
