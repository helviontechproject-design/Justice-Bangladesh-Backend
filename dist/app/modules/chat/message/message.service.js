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
exports.messageService = void 0;
const message_model_1 = require("./message.model");
const conversation_model_1 = require("../conversation/conversation.model");
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../errorHelpers/AppError"));
const QueryBuilder_1 = require("../../../utils/QueryBuilder");
const user_interface_1 = require("../../user/user.interface");
const sendMessage = (decodedUser, payload, file, req) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId, receiverId, content, contentType } = payload;
    // Verify conversation exists and user is part of it
    const conversationExists = yield conversation_model_1.ConversationModel.findById(conversationId);
    if (!conversationExists) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Conversation not found');
    }
    // Check if user is part of the conversation
    let isUserInThisConversation;
    if (decodedUser.role === user_interface_1.ERole.CLIENT) {
        isUserInThisConversation = conversationExists.clientUserId.toString() === decodedUser.userId;
    }
    else if (decodedUser.role === user_interface_1.ERole.LAWYER) {
        isUserInThisConversation = conversationExists.lawyerUserId.toString() === decodedUser.userId;
    }
    if (!isUserInThisConversation) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not part of this conversation');
    }
    // Prepare message data
    const messageData = {
        conversationId,
        senderId: decodedUser.userId,
        senderRole: decodedUser.role,
        receiver: receiverId,
        contentType: contentType || 'text',
    };
    // Handle file upload
    if (file) {
        messageData.imageOrFileUrl = file.path;
        messageData.contentType = file.mimetype.startsWith('image/') ? 'image' : 'file';
    }
    if (content) {
        messageData.content = content;
    }
    // Create message
    const message = yield message_model_1.MessageModel.create(messageData);
    // Update conversation's lastMessageAt
    yield conversation_model_1.ConversationModel.findByIdAndUpdate(conversationId, {
        lastMessageAt: new Date(),
    });
    // emit the socket event
    if (req.io && req.socketUserMap) {
        const receiverSocketId = req.socketUserMap.get(receiverId);
        if (receiverSocketId) {
            req.io.to(receiverSocketId).emit('receive_message', message);
            message.messageStatus = 'delivered';
            yield message.save();
        }
    }
    return message;
});
const getMessagesByConversation = (decodedUser, conversationId, query) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify conversation exists and user is part of it
    const conversationExists = yield conversation_model_1.ConversationModel.findById(conversationId);
    if (!conversationExists) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Conversation not found');
    }
    // Check if user is part of the conversation
    let isUserInThisConversation;
    if (decodedUser.role === user_interface_1.ERole.CLIENT) {
        isUserInThisConversation = conversationExists.clientUserId.toString() === decodedUser.userId;
    }
    else if (decodedUser.role === user_interface_1.ERole.LAWYER) {
        isUserInThisConversation = conversationExists.lawyerUserId.toString() === decodedUser.userId;
    }
    if (!isUserInThisConversation) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not part of this conversation');
    }
    const messages = message_model_1.MessageModel.find({ isDeleted: false }).populate('senderId', 'name email client lawyer')
        .populate('receiver', 'name email client lawyer')
        .sort({ createdAt: -1 });
    const queryBuilder = new QueryBuilder_1.QueryBuilder(messages, query);
    const allMessages = queryBuilder.paginate();
    const [data, meta] = yield Promise.all([
        allMessages.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const markMessageAsRead = (decodedUser, messageId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield message_model_1.MessageModel.findById(messageId);
    if (!message) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Message not found');
    }
    // Only receiver can mark as read
    if (message.receiver.toString() !== decodedUser.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Only receiver can mark message as read');
    }
    message.isRead = true;
    message.readAt = new Date();
    yield message.save();
    return message;
});
const addReaction = (decodedUser, messageId, emoji) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield message_model_1.MessageModel.findById(messageId);
    if (!message) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Message not found');
    }
    // Verify user is part of the conversation
    const conversationExists = yield conversation_model_1.ConversationModel.findById(message.conversationId);
    if (!conversationExists) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Conversation not found');
    }
    let isUserInThisConversation;
    if (decodedUser.role === user_interface_1.ERole.CLIENT) {
        isUserInThisConversation = conversationExists.clientUserId.toString() === decodedUser.userId;
    }
    else if (decodedUser.role === user_interface_1.ERole.LAWYER) {
        isUserInThisConversation = conversationExists.lawyerUserId.toString() === decodedUser.userId;
    }
    if (!isUserInThisConversation) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not part of this conversation');
    }
    // Check if user already reacted
    const existingReaction = message.reactions.find((r) => r.userId.toString() === decodedUser.userId);
    if (existingReaction) {
        existingReaction.emoji = emoji;
    }
    else {
        message.reactions.push({
            userId: decodedUser.userId,
            emoji,
        });
    }
    yield message.save();
    return message;
});
const deleteMessage = (decodedUser, messageId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield message_model_1.MessageModel.findById(messageId);
    if (!message) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Message not found');
    }
    // Only sender can delete
    if (message.senderId.toString() !== decodedUser.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Only sender can delete message');
    }
    const updatedMessage = yield message_model_1.MessageModel.findByIdAndUpdate(messageId, {
        isDeleted: true,
        deletedAt: new Date(),
    }, { new: true });
    return updatedMessage;
});
exports.messageService = {
    sendMessage,
    getMessagesByConversation,
    markMessageAsRead,
    addReaction,
    deleteMessage,
};
