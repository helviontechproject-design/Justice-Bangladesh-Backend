import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { lawyerServices } from "./lawyer.service";



const getPopularLawyers = catchAsync(
  async (req: Request, res: Response) => {
    const lawyers = await lawyerServices.getPopularLawyers();
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Popular lawyers retrieved successfully!',
      data: lawyers,
    });
  }
);

const getAllLawyers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const user = await lawyerServices.getAllLawyers(
      req.query as Record<string, string>
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Data received Successfully!',
      data: user.data,
      meta: user.meta
    });
  }
);


const updateLawyer = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;

    const payload = {
      ...req.body,
    };

    // Handle file upload for bar council certificate
    if (req.file?.path) {
      payload.lawyerDetails = payload.lawyerDetails ?? {};
      payload.lawyerDetails.bar_council_certificate = req.file.path;
    }

    const user = await lawyerServices.updateLawyer(
      decodedUser as JwtPayload,
      req.params.id,
      payload
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Lawyer profile updated successfully!',
      data: user,
    });
  }
);

const getLawyerbyId = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const lawyer = await lawyerServices.getLawyerById(id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Lawyer retrieved successfully!',
      data: lawyer,
    });
  }
);

const saveLawyerByClient = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user as JwtPayload;
    const { id } = req.params;

    const result = await lawyerServices.saveLawyerByClient(decodedUser, id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Lawyer saved successfully!',
      data: result,
    });
  }
);

const removeSavedLawyer = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user as JwtPayload;
    const { id } = req.params;

    const result = await lawyerServices.removeSavedLawyer(decodedUser, id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Lawyer removed from saved list successfully!',
      data: result,
    });
  }
);

const getMySavedLawyers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user as JwtPayload;

    const result = await lawyerServices.getMySavedLawyers(decodedUser);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Saved lawyers retrieved successfully!',
      data: result,
    });
  }
);


// ===== ADMIN CONTROLLERS =====

const adminGetAllLawyers = catchAsync(async (req: Request, res: Response) => {
  const result = await lawyerServices.adminGetAllLawyers(req.query as Record<string, string>);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'All lawyers retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const adminBanLawyer = catchAsync(async (req: Request, res: Response) => {
  const result = await lawyerServices.adminBanLawyer(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Lawyer ban status toggled',
    data: result,
  });
});

const adminVerifyLawyer = catchAsync(async (req: Request, res: Response) => {
  const result = await lawyerServices.adminVerifyLawyer(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Lawyer verification status toggled',
    data: result,
  });
});

const adminDeleteLawyer = catchAsync(async (req: Request, res: Response) => {
  const result = await lawyerServices.adminDeleteLawyer(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Lawyer deleted successfully',
    data: result,
  });
});

const adminUpdateLawyer = catchAsync(async (req: Request, res: Response) => {
  // Parse nested JSON strings from FormData
  const body = { ...req.body };
  const jsonFields = ['profile_Details', 'lawyerDetails', 'specialties', 'categories', 'call_fees', 'video_fees', 'educations'];
  jsonFields.forEach((field) => {
    if (typeof body[field] === 'string') {
      try { body[field] = JSON.parse(body[field]); } catch (_) {}
    }
  });

  // Handle profile photo upload to Cloudinary
  if (req.file?.path) {
    const { LawyerProfileModel } = await import('../lawyer/lawyer.model');
    const profile = await LawyerProfileModel.findById(req.params.id).select('userId');
    if (profile?.userId) {
      const { UserModel } = await import('../user/user.model');
      await UserModel.findByIdAndUpdate(profile.userId, { profilePhoto: req.file.path });
    }
  }

  const result = await lawyerServices.adminUpdateLawyer(req.params.id, body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Lawyer updated successfully',
    data: result,
  });
});

export const lawyerController = {
  getPopularLawyers,
  getAllLawyers,
  updateLawyer,
  getLawyerbyId,
  saveLawyerByClient,
  removeSavedLawyer,
  getMySavedLawyers,
  // Admin
  adminGetAllLawyers,
  adminBanLawyer,
  adminVerifyLawyer,
  adminDeleteLawyer,
  adminUpdateLawyer,
};