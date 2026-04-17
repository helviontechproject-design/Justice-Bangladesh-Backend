import { ConversationModel } from './conversation.model';
import { UserModel } from '../../user/user.model';
import AppError from '../../../errorHelpers/AppError';
import { StatusCodes } from 'http-status-codes';
import { QueryBuilder } from '../../../utils/QueryBuilder';
import { MessageModel } from '../message/message.model';

const getMyConversations = async (userId: string, query: Record<string, string>) => {
  // Get user to determine role
  const user = await UserModel.findById(userId);
  
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user.role !== 'CLIENT' && user.role !== 'LAWYER') {
    throw new AppError(StatusCodes.FORBIDDEN, 'Only clients and lawyers can access conversations');
  }

  // Build filter based on user role - using userId directly
  const filterQuery = user.role === 'CLIENT' 
    ? { clientUserId: userId }
    : { lawyerUserId: userId };

  // Apply QueryBuilder for pagination and sorting
  const conversations = ConversationModel.find(filterQuery)
    .populate({
      path: 'lawyerUserId',
      select: 'email profilePhoto lastSeen isOnline'
    })
    .populate({
      path: 'clientUserId',
      select: 'email profilePhoto lastSeen isOnline'
    });

  const queryBuilder = new QueryBuilder(conversations, query);
  const allConversations = queryBuilder.filter().sort().paginate();

  const [data, meta] = await Promise.all([
    allConversations.build().lean().exec(),
    queryBuilder.getMeta(),
  ]);

  // Get unread message count for each conversation
  const unreadCounts = await MessageModel.aggregate([
    {
      $match: {
        conversationId: { $in: data.map((conversation: any) => conversation._id) },
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
  const unreadCountMap = new Map(
    unreadCounts.map((item) => [item._id.toString(), item.count])
  );

  // Attach unread count to each conversation
  const conversationsWithCount = data.map((conversation: any) => ({
    ...conversation,
    unReadMessageCount: unreadCountMap.get(conversation._id.toString()) || 0,
  }));

  return {
    data: conversationsWithCount,
    meta,
  };
};

const getConversationById = async (conversationId: string, userId: string) => {
  const conversation = await ConversationModel.findById(conversationId)
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
    throw new AppError(StatusCodes.NOT_FOUND, 'Conversation not found');
  }

  // Verify user has access to this conversation - comparing userId directly
  const hasAccess =
    conversation.clientUserId._id.toString() === userId ||
    conversation.lawyerUserId._id.toString() === userId;

  if (!hasAccess) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You do not have access to this conversation');
  }

  return conversation;
};

export const conversationServices = {
  getMyConversations,
  getConversationById,
};
