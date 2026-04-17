import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { clientServices } from "./client.service";
import { UserModel } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";

const updateClient = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const payload = { ...req.body };
    const user = await clientServices.updateClient(
      decodedUser as JwtPayload,
      req.params.id,
      payload
    );
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Data received Successfully!', data: user });
  }
);

const getAllClients = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const user = await clientServices.getAllClients(req.query as Record<string, string>, decodedUser as JwtPayload);
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Data received Successfully!', data: user });
  }
);

const getClientbyid = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const client = await clientServices.getClientbyid(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Client retrieved successfully!', data: client });
  }
);

const banClient = catchAsync(async (req: Request, res: Response) => {
  const client = await clientServices.getClientbyid(req.params.userId);
  if (!client) throw new AppError(StatusCodes.NOT_FOUND, 'Client not found');
  const userId = typeof client.userId === 'object' ? (client.userId as any)._id : client.userId;
  await UserModel.findByIdAndUpdate(userId, { isActive: 'BLOCKED' });
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Client banned successfully', data: null });
});

const unbanClient = catchAsync(async (req: Request, res: Response) => {
  const client = await clientServices.getClientbyid(req.params.userId);
  if (!client) throw new AppError(StatusCodes.NOT_FOUND, 'Client not found');
  const userId = typeof client.userId === 'object' ? (client.userId as any)._id : client.userId;
  await UserModel.findByIdAndUpdate(userId, { isActive: 'ACTIVE' });
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Client unbanned successfully', data: null });
});

const deleteClient = catchAsync(async (req: Request, res: Response) => {
  await clientServices.deleteClient(req.params.id);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Client deleted successfully', data: null });
});

const toggleSaveLawyer = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const result = await clientServices.toggleSaveLawyer(decodedUser, req.params.lawyerId);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: result.saved ? 'Lawyer saved' : 'Lawyer unsaved', data: result });
});

const getSavedLawyers = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const result = await clientServices.getSavedLawyers(decodedUser);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Saved lawyers fetched', data: result });
});

export const clientController = {
  updateClient,
  getAllClients,
  getClientbyid,
  banClient,
  unbanClient,
  deleteClient,
  toggleSaveLawyer,
  getSavedLawyers,
};