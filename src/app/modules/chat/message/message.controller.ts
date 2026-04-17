import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { messageService } from './message.service';

const sendMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user as JwtPayload;
    const file = req.file;

    const result = await messageService.sendMessage(decodedUser, req.body, file as any, req);
    
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Message sent successfully!',
      data: result,
    });
  }
);

const getMessagesByConversation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user as JwtPayload;
    const { conversationId } = req.params;

    const result = await messageService.getMessagesByConversation(
      decodedUser,
      conversationId,
      req.query as Record<string, string>
    );
    
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Messages retrieved successfully!',
      data: result,
    });
  }
);



const addReaction = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user as JwtPayload;
    const { id } = req.params;
    const { emoji } = req.body;

    const result = await messageService.addReaction(decodedUser, id, emoji);
    
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Reaction added successfully!',
      data: result,
    });
  }
);

const deleteMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user as JwtPayload;
    const { id } = req.params;

    const result = await messageService.deleteMessage(decodedUser, id);
    
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Message deleted successfully!',
      data: result,
    });
  }
);

export const messageController = {
  sendMessage,
  getMessagesByConversation,
  addReaction,
  deleteMessage,
};
