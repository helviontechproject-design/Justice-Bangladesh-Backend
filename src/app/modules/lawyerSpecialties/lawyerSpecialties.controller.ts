import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { lawyerSpecialtyService } from './lawyerSpecialties.service';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';

const createLawyerSpecialty = catchAsync(async (req: Request, res: Response) => {
  const specialty = await lawyerSpecialtyService.createLawyerSpecialty(
    req.user as JwtPayload,
    { ...req.body, icon: req.file?.path }
  );
  sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: 'Specialty created', data: specialty });
});

const getAllLawyerSpecialties = catchAsync(async (req: Request, res: Response) => {
  const result = await lawyerSpecialtyService.getAllLawyerSpecialties(req.query as Record<string, string>);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Specialties fetched', data: result.data, meta: result.meta });
});

const getSingleLawyerSpecialty = catchAsync(async (req: Request, res: Response) => {
  const specialty = await lawyerSpecialtyService.getSingleLawyerSpecialty(req.params.id);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Specialty fetched', data: specialty });
});

const updateLawyerSpecialty = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.body, ...(req.file?.path && { icon: req.file.path }) };
  const specialty = await lawyerSpecialtyService.updateLawyerSpecialty(req.params.id, req.user as JwtPayload, payload);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Specialty updated', data: specialty });
});

const deleteLawyerSpecialty = catchAsync(async (req: Request, res: Response) => {
  await lawyerSpecialtyService.deleteLawyerSpecialty(req.params.id, req.user as JwtPayload);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Specialty deleted', data: null });
});

const getMySpecialties = catchAsync(async (req: Request, res: Response) => {
  const specialties = await lawyerSpecialtyService.getMySpecialties(req.user as JwtPayload);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Your specialties', data: specialties });
});

/** GET /lawyer-specialties/by-category/:categoryId */
const getByCategory = catchAsync(async (req: Request, res: Response) => {
  const data = await lawyerSpecialtyService.getByCategory(req.params.categoryId);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Specialties by category', data });
});

/** GET /lawyer-specialties/suggest?q=keyword */
const suggestSpecialties = catchAsync(async (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const data = await lawyerSpecialtyService.suggestSpecialties(q);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Suggestions', data });
});

/** Admin: POST /lawyer-specialties/admin/create */
const adminCreateSpecialty = catchAsync(async (req: Request, res: Response) => {
  const data = await lawyerSpecialtyService.adminCreateSpecialty({
    title: req.body.title,
    category: req.body.category,
    icon: req.file?.path || req.body.icon || '',
  });
  sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: 'Specialization created', data });
});

/** Admin: PUT /lawyer-specialties/admin/:id */
const adminUpdateSpecialty = catchAsync(async (req: Request, res: Response) => {
  const data = await lawyerSpecialtyService.adminUpdateSpecialty(req.params.id, req.body);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Specialization updated', data });
});

/** Admin: DELETE /lawyer-specialties/admin/:id */
const adminDeleteSpecialty = catchAsync(async (req: Request, res: Response) => {
  await lawyerSpecialtyService.adminDeleteSpecialty(req.params.id);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Specialization deleted', data: null });
});

export const lawyerSpecialtyController = {
  createLawyerSpecialty,
  getAllLawyerSpecialties,
  getSingleLawyerSpecialty,
  updateLawyerSpecialty,
  deleteLawyerSpecialty,
  getMySpecialties,
  getByCategory,
  suggestSpecialties,
  adminCreateSpecialty,
  adminUpdateSpecialty,
  adminDeleteSpecialty,
};
