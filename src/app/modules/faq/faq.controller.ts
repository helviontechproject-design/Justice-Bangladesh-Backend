import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { faqService } from './faq.service';
import { TFaqRole } from './faq.interface';

const getAll = catchAsync(async (req: Request, res: Response) => {
  const role = req.query.role as TFaqRole | undefined;
  const data = await faqService.getAll(role);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'FAQs fetched', data });
});

const getAllAdmin = catchAsync(async (req: Request, res: Response) => {
  const role = req.query.role as TFaqRole | undefined;
  const data = await faqService.getAllAdmin(role);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'FAQs fetched', data });
});

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await faqService.create(req.body);
  sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: 'FAQ created', data });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const data = await faqService.update(req.params.id, req.body);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'FAQ updated', data });
});

const remove = catchAsync(async (req: Request, res: Response) => {
  await faqService.remove(req.params.id);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'FAQ deleted', data: null });
});

export const faqController = { getAll, getAllAdmin, create, update, remove };
