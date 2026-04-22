import { JwtPayload } from "jsonwebtoken";
import { IAvailability } from "./availability.interface";
import { AvailabilityModel } from "./availability.model";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";
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

    // Auto-enable visibility settings when availability is saved
    const visibilityUpdate: any = {};
    if (payload.bookingType === 'Video Call') visibilityUpdate.videoConsult = true;
    else if (payload.bookingType === 'Audio Call') visibilityUpdate.audioCall = true;
    else if (payload.bookingType === 'In Person') visibilityUpdate.inPerson = true;
    
    if (Object.keys(visibilityUpdate).length > 0) {
      await LawyerProfileModel.findByIdAndUpdate(lawyerId, { $set: visibilityUpdate });
    }

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

    // Auto-enable visibility settings when availability is created
    const visibilityUpdate: any = {};
    if (payload.bookingType === 'Video Call') visibilityUpdate.videoConsult = true;
    else if (payload.bookingType === 'Audio Call') visibilityUpdate.audioCall = true;
    else if (payload.bookingType === 'In Person') visibilityUpdate.inPerson = true;
    
    if (Object.keys(visibilityUpdate).length > 0) {
      await LawyerProfileModel.findByIdAndUpdate(lawyerId, { $set: visibilityUpdate });
    }

    return {
      success: true,
      message: `Availability for ${payload.month} created successfully`,
      data: newAvailability,
    };
  }
};

const getAvailability = async (query: Record<string, string>) => {
  // Build base filter with proper ObjectId conversion
  const filter: any = {};
  if (query.lawyerId) {
    filter.lawyerId = new Types.ObjectId(query.lawyerId);
  }

  // Fetch all matching records without pagination limit
  const data = await AvailabilityModel.find(filter).sort({ month: 1 }).lean();

  // Filter by lawyer visibility settings
  if (query.lawyerId && data.length > 0) {
    const lawyer = await LawyerProfileModel.findById(query.lawyerId).lean();
    if (lawyer) {
      const filteredData = data.filter((availability) => {
        if (!availability.isActive) return false;
        const bt = availability.bookingType;
        if (bt === 'Video Call' && !lawyer.videoConsult) return false;
        if (bt === 'Audio Call' && !lawyer.audioCall) return false;
        if (bt === 'In Person' && !lawyer.inPerson) return false;
        return true;
      });
      return { data: filteredData, meta: { total: filteredData.length } };
    }
  }

  return { data, meta: { total: data.length } };
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

  const availabilities = await AvailabilityModel.find({ lawyerId: lawyer._id }).sort({ month: 1 });

  return {
    data: availabilities,
    meta: { total: availabilities.length },
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
    
    // Auto-enable visibility settings when availability is saved
    const visibilityUpdate: any = {};
    if (bookingType === 'Video Call') visibilityUpdate.videoConsult = true;
    else if (bookingType === 'Audio Call') visibilityUpdate.audioCall = true;
    else if (bookingType === 'In Person') visibilityUpdate.inPerson = true;
    
    if (Object.keys(visibilityUpdate).length > 0) {
      await LawyerProfileModel.findByIdAndUpdate(lawyerId, { $set: visibilityUpdate });
    }
    
    return existing;
  }
  const created = await AvailabilityModel.create({ lawyerId, bookingType, month, availableDates: availableDates || [], isActive: isActive ?? true });
  await LawyerProfileModel.findByIdAndUpdate(lawyerId, { $addToSet: { availability: created._id } });
  
  // Auto-enable visibility settings when availability is created
  const visibilityUpdate: any = {};
  if (bookingType === 'Video Call') visibilityUpdate.videoConsult = true;
  else if (bookingType === 'Audio Call') visibilityUpdate.audioCall = true;
  else if (bookingType === 'In Person') visibilityUpdate.inPerson = true;
  
  if (Object.keys(visibilityUpdate).length > 0) {
    await LawyerProfileModel.findByIdAndUpdate(lawyerId, { $set: visibilityUpdate });
  }
  
  return created;
}

async function syncAvailabilityWithVisibility(lawyerId: string) {
  const lawyer = await LawyerProfileModel.findById(lawyerId);
  if (!lawyer) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');
  }

  const availabilities = await AvailabilityModel.find({ lawyerId: new Types.ObjectId(lawyerId) });
  const visibilityUpdate: any = {};
  
  // Check what consultation types have availability and auto-enable them
  for (const availability of availabilities) {
    if (availability.isActive && availability.availableDates && availability.availableDates.length > 0) {
      if (availability.bookingType === 'Video Call') visibilityUpdate.videoConsult = true;
      else if (availability.bookingType === 'Audio Call') visibilityUpdate.audioCall = true;
      else if (availability.bookingType === 'In Person') visibilityUpdate.inPerson = true;
    }
  }
  
  if (Object.keys(visibilityUpdate).length > 0) {
    await LawyerProfileModel.findByIdAndUpdate(lawyerId, { $set: visibilityUpdate });
    return { message: 'Visibility settings synced with availability', updated: visibilityUpdate };
  }
  
  return { message: 'No sync needed', updated: {} };
}

export const availabilityService = {
  setAvailability,
  getAvailability,
  getAvailabilityById,
  deleteAvailability,
  getMyAvailability,
  getAvailabilityByLawyerId,
  adminSetAvailability,
  syncAvailabilityWithVisibility,
};
