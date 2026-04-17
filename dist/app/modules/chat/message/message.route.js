"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../../middlewares/checkAuth");
const user_interface_1 = require("../../user/user.interface");
const message_controller_1 = require("./message.controller");
const validateRequest_1 = require("../../../middlewares/validateRequest");
const message_validation_1 = require("./message.validation");
const multer_config_1 = require("../../../config/multer.config");
const router = (0, express_1.Router)();
// Send a message (CLIENT or LAWYER)
router.post('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT, user_interface_1.ERole.LAWYER), multer_config_1.multerUpload.single('file'), (0, validateRequest_1.validateRequest)(message_validation_1.createMessageSchema), message_controller_1.messageController.sendMessage);
// Get messages by conversation ID (CLIENT or LAWYER - own conversations only)
router.get('/conversation/:conversationId', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT, user_interface_1.ERole.LAWYER), message_controller_1.messageController.getMessagesByConversation);
// Add reaction to message (CLIENT or LAWYER)
router.patch('/:id/reaction', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT, user_interface_1.ERole.LAWYER), message_controller_1.messageController.addReaction);
// Delete message (CLIENT or LAWYER - sender only)
router.patch('/:id/delete', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT, user_interface_1.ERole.LAWYER), message_controller_1.messageController.deleteMessage);
exports.messageRoute = router;
