import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { categoryServices } from './category.service';
import { JwtPayload } from 'jsonwebtoken';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';

// ✅ Create Category
const createCategory = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const decodedUser = req.user as JwtPayload;

    const payload = {
      ...req.body,
      imageUrl: req.file?.path, // small letter to match interface
    };

    const result = await categoryServices.createCategory(payload, decodedUser);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Category created successfully',
      data: result,
    });
  }
);

// ✅ Get all categories
const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryServices.getAllCategories(req.query as Record<string, string>);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Categories retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

// ✅ Get single category
const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await categoryServices.getSingleCategory(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Category retrieved successfully',
    data: result,
  });
});

// ✅ Update category
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const { id } = req.params;

  const payload = {
    ...req.body,
  };

  if(req.file?.path){
    payload.imageUrl = req.file.path;
  }

  const result = await categoryServices.updateCategory(
    id,
    payload,
    decodedUser
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Category updated successfully',
    data: result,
  });
});

// ✅ Delete category
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as JwtPayload;
  const { id } = req.params;

  const result = await categoryServices.deleteCategory(id, decodedUser);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Category deleted successfully',
    data: null,
  });
});

export const categoryController = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};
