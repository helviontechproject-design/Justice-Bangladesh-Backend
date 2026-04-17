import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { bannerService } from "./banner.service";
import { JwtPayload } from "jsonwebtoken";


const createBanner = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    
    const payload = {
      ...req.body,
      ImageUrl: req.file?.path,
    };
    const banner = await bannerService.createBanner(
      payload,
      decodedUser as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Banner Created successfully`,
      data: banner,
    });
  }
);


const updateBanner = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;

    const payload = {
      ...req.body,
    };

    if (req.file?.path) { 
      payload.ImageUrl = req.file.path;
    }
    const banner = await bannerService.updateBanner(
      req.params.id,
      payload,
      decodedUser as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Banner Updated successfully`,
      data: banner,
    });
  }
);


const getAllBanners = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const banner = await bannerService.getAllBanners(req.query as Record<string, string>);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Banners fetched successfully`,
      data: banner,
    });
  }
);


const deleteBanner = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const banner = await bannerService.deleteBanner(
      req.params.id, decodedUser as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Banner Deleted successfully`,
      data: null,
    });
  }
);





export const bannerController = {
  createBanner,
  updateBanner,
  getAllBanners,
  deleteBanner,
};