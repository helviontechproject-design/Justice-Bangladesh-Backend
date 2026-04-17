import { JwtPayload } from 'jsonwebtoken';
import { MessageModel } from './message.model';
import { ConversationModel } from '../conversation/conversation.model';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errorHelpers/AppError';
import { QueryBuilder } from '../../../utils/QueryBuilder';
import { ERole } from '../../user/user.interface';
import { Request } from 'express';

const sendMessage = async (
  decodedUser: JwtPayload,
  payload: any,
  file: Express.Multer.File,
  req: Request
) => {
  const { conversationId, receiverId, content, contentType } = payload;

  // Verify conversation exists and user is part of it
  const conversationExists = await ConversationModel.findById(conversationId);
  if (!conversationExists) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Conversation not found');
  }

  // Check if user is part of the conversation
  let isUserInThisConversation;

  if(decodedUser.role === ERole.CLIENT){
    isUserInThisConversation = conversationExists.clientUserId.toString() === decodedUser.userId;
  }else if(decodedUser.role === ERole.LAWYER){
    isUserInThisConversation = conversationExists.lawyerUserId.toString() === decodedUser.userId;
  }

  if (!isUserInThisConversation) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You are not part of this conversation');
  }

  // Prepare message data
  const messageData: any = {
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
  const message = await MessageModel.create(messageData);

  // Update conversation's lastMessageAt
  await ConversationModel.findByIdAndUpdate(conversationId, {
    lastMessageAt: new Date(),
  });

  // emit the socket event

  if (req.io && req.socketUserMap) {
    const receiverSocketId = req.socketUserMap.get(receiverId)
     if (receiverSocketId) {
       req.io.to(receiverSocketId).emit('receive_message', message);
       message.messageStatus = 'delivered';
       await message.save()
    }
  }
  
  return message;
};

const getMessagesByConversation = async (
  decodedUser: JwtPayload,
  conversationId: string,
  query: Record<string, string>
) => {
  // Verify conversation exists and user is part of it
  const conversationExists = await ConversationModel.findById(conversationId);
  if (!conversationExists) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Conversation not found');
  }

  // Check if user is part of the conversation
  let isUserInThisConversation;

  if (decodedUser.role === ERole.CLIENT) {
    isUserInThisConversation = conversationExists.clientUserId.toString() === decodedUser.userId;
  } else if (decodedUser.role === ERole.LAWYER) {
    isUserInThisConversation = conversationExists.lawyerUserId.toString() === decodedUser.userId;
  }

  if (!isUserInThisConversation) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You are not part of this conversation');
  }

  const messages = MessageModel.find({isDeleted: false}).populate('senderId', 'name email client lawyer')
    .populate('receiver', 'name email client lawyer')
    .sort({ createdAt: -1 })
  

  const queryBuilder = new QueryBuilder(messages, query);

  const allMessages = queryBuilder.paginate();

  const [data, meta] = await Promise.all([
    allMessages.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};



const markMessageAsRead = async (decodedUser: JwtPayload, messageId: string) => {
  const message = await MessageModel.findById(messageId);
  if (!message) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Message not found');
  }

  // Only receiver can mark as read
  if (message.receiver.toString() !== decodedUser.userId) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Only receiver can mark message as read');
  }

  message.isRead = true;
  message.readAt = new Date();
  await message.save();

  return message;
};

const addReaction = async (
  decodedUser: JwtPayload,
  messageId: string,
  emoji: string
) => {
  const message = await MessageModel.findById(messageId);
  if (!message) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Message not found');
  }

  // Verify user is part of the conversation
  const conversationExists = await ConversationModel.findById(message.conversationId);
  if (!conversationExists) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Conversation not found');
  }
  let isUserInThisConversation;

  if (decodedUser.role === ERole.CLIENT) {
    isUserInThisConversation = conversationExists.clientUserId.toString() === decodedUser.userId;
  } else if (decodedUser.role === ERole.LAWYER) {
    isUserInThisConversation = conversationExists.lawyerUserId.toString() === decodedUser.userId;
  }

  if (!isUserInThisConversation) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You are not part of this conversation');
  }

  // Check if user already reacted
  const existingReaction = message.reactions.find(
    (r) => r.userId.toString() === decodedUser.userId
  );

  if (existingReaction) {
    existingReaction.emoji = emoji;
  } else {
    message.reactions.push({
      userId: decodedUser.userId as any,
      emoji,
    });
  }

  await message.save();
  return message;
};

const deleteMessage = async (decodedUser: JwtPayload, messageId: string) => {
  const message = await MessageModel.findById(messageId);
  if (!message) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Message not found');
  }

  // Only sender can delete
  if (message.senderId.toString() !== decodedUser.userId) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Only sender can delete message');
  }

  const updatedMessage = await MessageModel.findByIdAndUpdate(messageId, {
    isDeleted: true,
    deletedAt: new Date(),
  }, { new: true })
  return updatedMessage;
};

export const messageService = {
  sendMessage,
  getMessagesByConversation,
  markMessageAsRead,
  addReaction,
  deleteMessage,
};
