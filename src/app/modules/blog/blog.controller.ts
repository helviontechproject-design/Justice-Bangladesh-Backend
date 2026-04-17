import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { blogService } from './blog.service';

const createBlog = catchAsync(async (req: Request, res: Response) => {
  const imageUrl = (req.file as any)?.path || req.body.imageUrl;
  const data = await blogService.createBlog({ ...req.body, imageUrl });
  sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: 'Blog created', data });
});

const getAllBlogs = catchAsync(async (req: Request, res: Response) => {
  const data = await blogService.getAllBlogs();
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Blogs fetched', data });
});

const getAllBlogsAdmin = catchAsync(async (req: Request, res: Response) => {
  const data = await blogService.getAllBlogsAdmin();
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Blogs fetched', data });
});

const updateBlog = catchAsync(async (req: Request, res: Response) => {
  const imageUrl = (req.file as any)?.path;
  const payload = imageUrl ? { ...req.body, imageUrl } : req.body;
  const data = await blogService.updateBlog(req.params.id, payload);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Blog updated', data });
});

const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  const data = await blogService.deleteBlog(req.params.id);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Blog deleted', data });
});

export const blogController = { createBlog, getAllBlogs, getAllBlogsAdmin, updateBlog, deleteBlog };
