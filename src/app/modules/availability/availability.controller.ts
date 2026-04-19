import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { availabilityService } from "./availability.service";
import { JwtPayload } from "jsonwebtoken";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";







const setAvailability = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const Availability = await availabilityService.setAvailability(
      decodedUser as JwtPayload,
      req.body
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `${Availability.message}`,
      data: Availability.data,
    });
  }
);

const getAvailability = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const Availability = await availabilityService.getAvailability(req.query as Record<string, string>);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Availability fetched successfully`,
      data: Availability.data,
      meta: Availability.meta,
    });
  }
);

const getAvailabilityById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const availability = await availabilityService.getAvailabilityById(id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Availability fetched successfully`,
      data: availability,
    });
  }
);


const deleteAvailability = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const decodedUser = req.user;
    await availabilityService.deleteAvailability(id, decodedUser as JwtPayload);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Availability deleted successfully`,
      data: null,
    });
  }
);

const getMyAvailability = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const availability = await availabilityService.getMyAvailability(
      decodedUser as JwtPayload,
      req.query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Your availability fetched successfully`,
      data: availability.data,
      meta: availability.meta,
    });
  }
);

const getAvailabilityByLawyerId = catchAsync(async (req: Request, res: Response) => {
  const data = await availabilityService.getAvailabilityByLawyerId(req.params.lawyerId);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Availability fetched', data });
});

const adminSetAvailability = catchAsync(async (req: Request, res: Response) => {
  const data = await availabilityService.adminSetAvailability(req.body);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: 'Availability saved', data });
});

const syncAvailabilityWithVisibility = catchAsync(async (req: Request, res: Response) => {
  const { lawyerId } = req.params;
  const data = await availabilityService.syncAvailabilityWithVisibility(lawyerId);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: data.message, data: data.updated });
});

export const availabilityController = {
  setAvailability,
  getAvailability,
  getAvailabilityById,
  deleteAvailability,
  getMyAvailability,
  getAvailabilityByLawyerId,
  adminSetAvailability,
  syncAvailabilityWithVisibility,
};