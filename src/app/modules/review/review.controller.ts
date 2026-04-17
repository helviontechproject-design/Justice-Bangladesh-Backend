import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { reviewService } from './review.service';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';

const createReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user ?? null;
    const review = await reviewService.createReview(
      decodedUser as JwtPayload | null,
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Review submitted successfully',
      data: review,
    });
  }
);

const getAllReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await reviewService.getAllReviews(
      req.query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Reviews fetched successfully',
      data: result.data,
      meta: result.meta,
    });
  }
);

const getReviewsByLawyer = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { lawyerId } = req.params;
    const result = await reviewService.getReviewsByLawyer(
      lawyerId,
      req.query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Lawyer reviews fetched successfully',
      data: result.data,
      meta: result.meta,
    });
  }
);

const getMyReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const result = await reviewService.getMyReviews(
      decodedUser as JwtPayload,
      req.query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Your reviews fetched successfully',
      data: result.data,
      meta: result.meta,
    });
  }
);

const getSingleReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const review = await reviewService.getSingleReview(id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Review fetched successfully',
      data: review,
    });
  }
);

const updateReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const decodedUser = req.user;
    const review = await reviewService.updateReview(
      id,
      decodedUser as JwtPayload,
      req.body
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Review updated successfully',
      data: review,
    });
  }
);

const deleteReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const decodedUser = req.user;
    await reviewService.deleteReview(id, decodedUser as JwtPayload);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Review deleted successfully',
      data: null,
    });
  }
);

const getReviewStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await reviewService.getReviewStats();
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Review statistics fetched successfully', data: stats });
  }
);

const adminGetAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewService.adminGetAllReviews(req.query as Record<string, string>);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'All reviews fetched', data: result.data, meta: result.meta });
});

const adminApproveReview = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewService.adminApproveReview(req.params.id);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: `Review ${result.isApproved ? 'approved' : 'unapproved'}`, data: result });
});

const adminDeleteReview = catchAsync(async (req: Request, res: Response) => {
  await reviewService.adminDeleteReview(req.params.id);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Review deleted', data: null });
});

const getReviewsByService = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { serviceId } = req.params;
    const result = await reviewService.getReviewsByService(serviceId);
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Service reviews fetched', data: result });
  }
);

export const reviewController = {
  createReview, getAllReviews, getReviewsByLawyer, getReviewsByService, getMyReviews,
  getSingleReview, updateReview, deleteReview, getReviewStats,
  adminGetAllReviews, adminApproveReview, adminDeleteReview,
};
