import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { policyService } from './policy.service';
import { TPolicyRole, TPolicyType } from './policy.interface';

const get = catchAsync(async (req: Request, res: Response) => {
  const { type, role } = req.query as { type: TPolicyType; role: TPolicyRole };
  const data = await policyService.get(type, role);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Policy fetched', data });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const role = req.query.role as TPolicyRole | undefined;
  const data = await policyService.getAll(role);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Policies fetched', data });
});

const upsert = catchAsync(async (req: Request, res: Response) => {
  const { type, role, content } = req.body as { type: TPolicyType; role: TPolicyRole; content: string };
  const data = await policyService.upsert(type, role, content);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Policy saved', data });
});

export const policyController = { get, getAll, upsert };
