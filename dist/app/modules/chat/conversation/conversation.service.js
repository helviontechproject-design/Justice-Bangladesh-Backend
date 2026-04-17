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
exports.conversationServices = void 0;
const conversation_model_1 = require("./conversation.model");
const user_model_1 = require("../../user/user.model");
const AppError_1 = __importDefault(require("../../../errorHelpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
const QueryBuilder_1 = require("../../../utils/QueryBuilder");
const message_model_1 = require("../message/message.model");
const getMyConversations = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    // Get user to determine role
    const user = yield user_model_1.UserModel.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    if (user.role !== 'CLIENT' && user.role !== 'LAWYER') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Only clients and lawyers can access conversations');
    }
    // Build filter based on user role - using userId directly
    const filterQuery = user.role === 'CLIENT'
        ? { clientUserId: userId }
        : { lawyerUserId: userId };
    // Apply QueryBuilder for pagination and sorting
    const conversations = conversation_model_1.ConversationModel.find(filterQuery)
        .populate({
        path: 'lawyerUserId',
        select: 'email profilePhoto lastSeen isOnline'
    })
        .populate({
        path: 'clientUserId',
        select: 'email profilePhoto lastSeen isOnline'
    });
    const queryBuilder = new QueryBuilder_1.QueryBuilder(conversations, query);
    const allConversations = queryBuilder.filter().sort().paginate();
    const [data, meta] = yield Promise.all([
        allConversations.build().lean().exec(),
        queryBuilder.getMeta(),
    ]);
    // Get unread message count for each conversation
    const unreadCounts = yield message_model_1.MessageModel.aggregate([
        {
            $match: {
                conversationId: { $in: data.map((conversation) => conversation._id) },
                isRead: false,
                senderId: { $ne: userId },
            },
        },
        {
            $group: {
                _id: '$conversationId',
                count: { $sum: 1 },
            },
        },
    ]);
    // Create a map for quick lookup
    const unreadCountMap = new Map(unreadCounts.map((item) => [item._id.toString(), item.count]));
    // Attach unread count to each conversation
    const conversationsWithCount = data.map((conversation) => (Object.assign(Object.assign({}, conversation), { unReadMessageCount: unreadCountMap.get(conversation._id.toString()) || 0 })));
    return {
        data: conversationsWithCount,
        meta,
    };
});
const getConversationById = (conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield conversation_model_1.ConversationModel.findById(conversationId)
        .populate('appointmentId')
        .populate({
        path: 'lawyerUserId',
        select: 'email profilePhoto lastSeen isOnline'
    })
        .populate({
        path: 'clientUserId',
        select: 'email profilePhoto lastSeen isOnline'
    });
    if (!conversation) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Conversation not found');
    }
    // Verify user has access to this conversation - comparing userId directly
    const hasAccess = conversation.clientUserId._id.toString() === userId ||
        conversation.lawyerUserId._id.toString() === userId;
    if (!hasAccess) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You do not have access to this conversation');
    }
    return conversation;
});
exports.conversationServices = {
    getMyConversations,
    getConversationById,
};
