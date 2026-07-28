import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { instantConsultancyService } from './instantConsultancy.service';

const initPayment = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  // Upload documents if any
  const files = (req.files as Express.Multer.File[]) || [];
  let documentUrls: string[] = [];
  if (files.length > 0) {
    documentUrls = await instantConsultancyService.uploadDocuments(files);
  }
  const result = await instantConsultancyService.initPayment(decodedUser, { ...req.body, documentUrls });
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'PayStation payment initiated', data: result });
});

const createRequest = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const files = (req.files as Express.Multer.File[]) || [];
  let documentUrls: string[] = [];
  if (files.length > 0) {
    documentUrls = await instantConsultancyService.uploadDocuments(files);
  }
  const result = await instantConsultancyService.createRequest(decodedUser, {
    ...req.body,
    documentUrls,
  });
  sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: 'Request created. Notifying available lawyers...', data: result });
});

const acceptRequest = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const result = await instantConsultancyService.acceptRequest(decodedUser, req.params.requestId);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Request accepted. Starting call...', data: result });
});

const getPendingForLawyer = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const result = await instantConsultancyService.getPendingForLawyer(decodedUser);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Pending request', data: result });
});

const getRequestStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await instantConsultancyService.getRequestStatus(req.params.requestId);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Request status', data: result });
});

const cancelRequest = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const result = await instantConsultancyService.cancelRequest(decodedUser, req.params.requestId);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Request cancelled', data: result });
});

const adminGetAll = catchAsync(async (_req: Request, res: Response) => {
  const result = await instantConsultancyService.adminGetAll();
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'All requests', data: result });
});

const getSettings = catchAsync(async (_req: Request, res: Response) => {
  const result = await instantConsultancyService.getSettings();
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Settings', data: result });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await instantConsultancyService.updateSettings(req.body);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Settings updated', data: result });
});

// Items
const createItem = catchAsync(async (req: Request, res: Response) => {
  const result = await instantConsultancyService.createItem(req.body);
  sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: 'Item created', data: result });
});

const getItems = catchAsync(async (_req: Request, res: Response) => {
  const result = await instantConsultancyService.getItems();
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Items', data: result });
});

const getAllItems = catchAsync(async (_req: Request, res: Response) => {
  const result = await instantConsultancyService.getAllItems();
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'All items', data: result });
});

const updateItem = catchAsync(async (req: Request, res: Response) => {
  const result = await instantConsultancyService.updateItem(req.params.id, req.body);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Item updated', data: result });
});

const deleteItem = catchAsync(async (req: Request, res: Response) => {
  const result = await instantConsultancyService.deleteItem(req.params.id);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Item deleted', data: result });
});

// PayStation callback handler - PUBLIC endpoint, no auth required
const paymentCallback = catchAsync(async (req: Request, res: Response) => {
  const orderId = (req.query.orderId || req.body.orderId) as string;
  
  if (!orderId) {
    return sendResponse(res, { 
      success: false, 
      statusCode: StatusCodes.BAD_REQUEST, 
      message: 'Order ID is required',
      data: null 
    });
  }

  try {
    const result = await instantConsultancyService.verifyPaymentCallback(orderId);
    return sendResponse(res, { 
      success: true, 
      statusCode: StatusCodes.OK, 
      message: 'Payment verified successfully', 
      data: result 
    });
  } catch (error: any) {
    return sendResponse(res, { 
      success: false, 
      statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, 
      message: error.message || 'Payment verification failed',
      data: null 
    });
  }
});

export const instantConsultancyController = {
  initPayment,
  paymentCallback, // ← ADD: Payment callback handler
  createRequest,
  acceptRequest,
  getPendingForLawyer,
  getRequestStatus,
  cancelRequest,
  adminGetAll,
  getSettings,
  updateSettings,
  createItem,
  getItems,
  getAllItems,
  updateItem,
  deleteItem,
};
