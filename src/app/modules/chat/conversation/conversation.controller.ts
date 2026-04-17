import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { conversationServices } from './conversation.service';

const getMyConversations = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).userId;
  const result = await conversationServices.getMyConversations(userId, req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Conversations retrieved successfully',
    data: result.data,
    meta: result.meta
  });
});

const getConversationById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req.user as any).userId;
  const result = await conversationServices.getConversationById(id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Conversation retrieved successfully',
    data: result,
  });
});

export const conversationController = {
  getMyConversations,
  getConversationById,
};
