"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../../middlewares/checkAuth");
const user_interface_1 = require("../../user/user.interface");
const conversation_controller_1 = require("./conversation.controller");
const router = (0, express_1.Router)();
// Get authenticated user's conversations (CLIENT or LAWYER)
router.get('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT, user_interface_1.ERole.LAWYER), conversation_controller_1.conversationController.getMyConversations);
// Get single conversation by ID (CLIENT or LAWYER - own conversations only)
router.get('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT, user_interface_1.ERole.LAWYER), conversation_controller_1.conversationController.getConversationById);
exports.conversationRoute = router;
