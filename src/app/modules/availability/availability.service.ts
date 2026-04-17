import { JwtPayload } from "jsonwebtoken";
import { IAvailability } from "./availability.interface";
import { AvailabilityModel } from "./availability.model";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { availabilitiesSearchableFields } from "../../constants";
import { LawyerProfileModel } from "../lawyer/lawyer.model";

export const setAvailability = async (
  decodedUser: JwtPayload,
  payload: Partial<IAvailability>,
) => {
  const lawyerId = payload.lawyerId;

  const lawyer = await LawyerProfileModel.findOne({
    userId: decodedUser.userId,
  });

  if (!lawyer) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized user");
  }

  const payloadLawyerId = new Types.ObjectId(payload?.lawyerId);

  if (!lawyer._id.equals(payloadLawyerId)) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized user");
  }

  //  Basic validation
  if (!payload.month || !payload.bookingType) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Missing required fields");
  }

  //  Check if availability for this month and bookingType already exists
  const existingAvailability = await AvailabilityModel.findOne({
    lawyerId: new Types.ObjectId(lawyerId),
    bookingType: payload.bookingType,
    month: payload.month,
  });

  if (existingAvailability) {
    //  Update existing availability
    existingAvailability.availableDates =
      payload.availableDates || existingAvailability.availableDates;
    existingAvailability.isActive =
      payload.isActive ?? existingAvailability.isActive;

    await existingAvailability.save();

    return {
      success: true,
      message: `Availability for ${payload.month} updated successfully`,
      data: existingAvailability,
    };
  } else {
    // Create new monthly availability
    const newAvailability = await AvailabilityModel.create({
      lawyerId,
      bookingType: payload.bookingType,
      month: payload.month,
      availableDates: payload.availableDates || [],
      isActive: payload.isActive ?? true,
    });

    await LawyerProfileModel.findByIdAndUpdate(
      lawyerId,
      {
        $push: { availability: newAvailability._id },
      },
      { new: true },
    );

    return {
      success: true,
      message: `Availability for ${payload.month} created successfully`,
      data: newAvailability,
    };
  }
};

const getAvailability = async (query: Record<string, string>) => {
  const availabilities = AvailabilityModel.find();

  const queryBuilder = new QueryBuilder(availabilities, query);

  const allAvailabilities = queryBuilder
    .search(availabilitiesSearchableFields)
    .filter()
    .paginate();

  const [data, meta] = await Promise.all([
    allAvailabilities.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getAvailabilityById = async (id: string) => {
  const availability =
    await AvailabilityModel.findById(id).populate("lawyerId");

  if (!availability) {
    throw new AppError(StatusCodes.NOT_FOUND, "Availability not found");
  }

  return availability;
};

const deleteAvailability = async (id: string, decodedUser: JwtPayload) => {
  const availability = await AvailabilityModel.findById(id);

  if (!availability) {
    throw new AppError(StatusCodes.NOT_FOUND, "Availability not found");
  }

  const lawyer = await LawyerProfileModel.findOne({
    userId: decodedUser.userId,
  });

  if (!lawyer) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized user");
  }

  if (!lawyer._id.equals(availability.lawyerId)) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "You can only delete your own availability",
    );
  }

  await AvailabilityModel.findByIdAndDelete(id);
};

const getMyAvailability = async (
  decodedUser: JwtPayload,
  query: Record<string, string>,
) => {
  const lawyer = await LawyerProfileModel.findOne({
    userId: decodedUser.userId,
  });

  if (!lawyer) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized user");
  }

  const availabilities = AvailabilityModel.find({ lawyerId: lawyer._id });

  const queryBuilder = new QueryBuilder(availabilities, query);

  const allAvailabilities = queryBuilder.filter().paginate();

  const [data, meta] = await Promise.all([
    allAvailabilities.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

async function getAvailabilityByLawyerId(lawyerId: string) {
  return AvailabilityModel.find({ lawyerId: new Types.ObjectId(lawyerId) }).sort({ month: 1 });
}

async function adminSetAvailability(payload: Partial<IAvailability>) {
  const { lawyerId, bookingType, month, availableDates, isActive } = payload;
  if (!lawyerId || !bookingType || !month) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Missing required fields');
  }
  const existing = await AvailabilityModel.findOne({
    lawyerId: new Types.ObjectId(lawyerId as unknown as string),
    bookingType,
    month,
  });
  if (existing) {
    existing.availableDates = availableDates || existing.availableDates;
    if (isActive !== undefined) existing.isActive = isActive;
    await existing.save();
    return existing;
  }
  const created = await AvailabilityModel.create({ lawyerId, bookingType, month, availableDates: availableDates || [], isActive: isActive ?? true });
  await LawyerProfileModel.findByIdAndUpdate(lawyerId, { $addToSet: { availability: created._id } });
  return created;
}

export const availabilityService = {
  setAvailability,
  getAvailability,
  getAvailabilityById,
  deleteAvailability,
  getMyAvailability,
  getAvailabilityByLawyerId,
  adminSetAvailability,
};
