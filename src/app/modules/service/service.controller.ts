import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { JwtPayload } from 'jsonwebtoken';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { serviceServices } from './service.service';

const createService = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const decodedUser = req.user as JwtPayload;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const payload = {
      ...req.body,
      imageUrl: files?.['image']?.[0]?.path || req.file?.path,
      iconUrl: files?.['icon']?.[0]?.path,
    };

    const result = await serviceServices.createService(payload, decodedUser);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Service created successfully',
      data: result,
    });
  }
);

const getAllCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await serviceServices.getAllCategories();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

const getFeaturedServices = catchAsync(async (_req: Request, res: Response) => {
  const result = await serviceServices.getFeaturedServices();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Featured services retrieved successfully',
    data: result,
  });
});

const getSingleService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await serviceServices.getSingleService(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Service retrieved successfully',
    data: result,
  });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const { id } = req.params;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  const payload: any = { ...req.body };
  if (files?.['image']?.[0]?.path) payload.imageUrl = files['image'][0].path;
  else if (req.file?.path) payload.imageUrl = req.file.path;
  if (files?.['icon']?.[0]?.path) payload.iconUrl = files['icon'][0].path;

  const result = await serviceServices.updateService(id, payload, decodedUser);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Service updated successfully',
    data: result,
  });
});

const deleteService = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const { id } = req.params;
  await serviceServices.deleteService(id, decodedUser);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Service deleted successfully',
    data: null,
  });
});

export const serviceController = {
  createService,
  getAllCategories,
  getFeaturedServices,
  getSingleService,
  updateService,
  deleteService,
};
