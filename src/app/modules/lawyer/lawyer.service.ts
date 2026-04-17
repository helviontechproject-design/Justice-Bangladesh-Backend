import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { LawyerProfileModel } from "./lawyer.model";
import { JwtPayload } from "jsonwebtoken";
import { ILawyerProfile } from "./lawyer.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { lawyerSearchableFields } from "../../constants";
import { ClientProfileModel } from "../client/client.model";
import { UserModel } from "../user/user.model";
import { EIsActive } from "../user/user.interface";



const getPopularLawyers = async () => {
  return LawyerProfileModel.find({ isPopular: true })
    .populate('userId', 'email profilePhoto isActive')
    .populate('specialties', 'title icon')
    .select('profile_Details lawyerDetails quialification designation per_consultation_fee avarage_rating appointments_Count totalReviews isPopular isSpecial userId specialties')
    .sort({ avarage_rating: -1 })
    .limit(20);
};

const getAllLawyers = async (query: Record<string, string>) => {
  // Build initial filter for categories, specialties, services
  const initialFilter: any = {};

  // Handle category filtering - use string IDs since DB has strings
  if (query.categories) {
    const categoryIds = query.categories.split(',').map(id => id.trim());
    initialFilter.categories = { $in: categoryIds };
  }

  // Handle specialty filtering
  if (query.specialties) {
    const specialtyIds = query.specialties.split(',').map(id => id.trim());
    initialFilter.specialties = { $in: specialtyIds };
  }

  // Handle service filtering
  if (query.services) {
    const serviceIds = query.services.split(',').map(id => id.trim());
    initialFilter.services = { $in: serviceIds };
  }


  // Handle consultation fee filtering
  if (query.minFee || query.maxFee) {
    initialFilter.per_consultation_fee = {};
    
    if (query.minFee) {
      initialFilter.per_consultation_fee.$gte = Number(query.minFee);
    }
    
    if (query.maxFee) {
      initialFilter.per_consultation_fee.$lte = Number(query.maxFee);
    }
  }

  // Handle rating filtering - range based (e.g., rating=3 matches 3.0-3.99)
  if (query.avarage_rating) {
    const rating = Number(query.avarage_rating);
    initialFilter.avarage_rating = {
      $gte: rating,
      $lt: rating + 1
    };
  }

  // Create query with initial filter
  const lawyers = LawyerProfileModel.find(initialFilter)
    .populate('userId', 'email profilePhoto isActive isOnline lastSeen')
    .populate('specialties', 'title')
    .populate('categories', 'name slug icon imageUrl _id')
    .select('-walletId -withdrawals -reviews -work_experience -favorite_count -appointments_Count -services -lawyerDetails -chambers_Count -contactInfo -educations -totalReviews')

  // Remove custom filters from query object for QueryBuilder
  const queryWithoutCustomFilters = { ...query };
  delete queryWithoutCustomFilters.categories;
  delete queryWithoutCustomFilters.specialties;
  delete queryWithoutCustomFilters.avarage_rating;
  delete queryWithoutCustomFilters.minRating;
  delete queryWithoutCustomFilters.maxRating;
  delete queryWithoutCustomFilters.minFee;
  delete queryWithoutCustomFilters.maxFee;

  const queryBuilder = new QueryBuilder(lawyers, queryWithoutCustomFilters);

  const allLawyers = queryBuilder
    .search(lawyerSearchableFields)
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    allLawyers.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};


const updateLawyer = async (decodedUser: JwtPayload, lawyerId: string, payload: Partial<ILawyerProfile>)=>{
  const lawyer = await LawyerProfileModel.findById(lawyerId);

  if (!decodedUser.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized to perform this action');
  }
  if (!lawyer) {
    throw new AppError(StatusCodes.NOT_FOUND, 'lawyer not found');
  }

  // Auto-update chambers_Count when chambers array is provided
  if (Array.isArray(payload.chambers)) {
    payload.chambers_Count = payload.chambers.length;
  }

  // Flatten nested objects into dot-notation $set to prevent overwriting
  // sibling fields inside the same nested object (e.g. lawyerDetails, profile_Details)
  const flatSet: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        flatSet[`${key}.${nestedKey}`] = nestedValue;
      }
    } else {
      flatSet[key] = value;
    }
  }

  const updatedLawyer = await LawyerProfileModel.findByIdAndUpdate(
    lawyerId,
    { $set: flatSet },
    { new: true }
  );
  return updatedLawyer;
};

const getLawyerById = async (lawyerId: string) => {
  const lawyer = await LawyerProfileModel.findById(lawyerId)
    .populate('availability', 'bookingType month availableDates isActive createdAt updatedAt')
    .populate('userId', 'name phoneNo email profilePhoto isActive')
    .populate('specialties', 'title')
    .populate('categories', 'name slug icon imageUrl _id')
    .populate('services', 'name slug icon')
    .populate('reviews')
    .populate('work_experience')
    .select('-walletId -withdrawals');

  if (!lawyer) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');
  }

  await LawyerProfileModel.findByIdAndUpdate(lawyerId, { $inc: { views: 1 } });

  return lawyer;
};

const saveLawyerByClient = async (decodedUser: JwtPayload, lawyerId: string) => {
  // Get client profile
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Client profile not found');
  }

  // Verify lawyer exists
  const lawyer = await LawyerProfileModel.findById(lawyerId);
  if (!lawyer) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');
  }

  // Check if lawyer is already saved
  const isAlreadySaved = client.savedLawyers?.some(
    (savedId) => savedId.toString() === lawyerId
  );

  if (isAlreadySaved) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Lawyer is already in your saved list');
  }

  // Add lawyer to client's saved list
  await ClientProfileModel.findByIdAndUpdate(client._id, {
    $push: { savedLawyers: lawyerId },
  });

  // Increment lawyer's favorite count
  await LawyerProfileModel.findByIdAndUpdate(lawyerId, {
    $inc: { favorite_count: 1 },
  });

  return {
    message: 'Lawyer saved successfully',
    lawyerId,
  };
};

const removeSavedLawyer = async (decodedUser: JwtPayload, lawyerId: string) => {
  // Get client profile
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Client profile not found');
  }

  // Verify lawyer exists
  const lawyer = await LawyerProfileModel.findById(lawyerId);
  if (!lawyer) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');
  }

  // Check if lawyer is in saved list
  const isSaved = client.savedLawyers?.some(
    (savedId) => savedId.toString() === lawyerId
  );

  if (!isSaved) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Lawyer is not in your saved list');
  }

  // Remove lawyer from client's saved list
  await ClientProfileModel.findByIdAndUpdate(client._id, {
    $pull: { savedLawyers: lawyerId },
  });

  // Decrement lawyer's favorite count (but not below 0)
  await LawyerProfileModel.findByIdAndUpdate(lawyerId, {
    $inc: { favorite_count: -1 },
  });

  // Ensure favorite_count doesn't go below 0
  const updatedLawyer = await LawyerProfileModel.findById(lawyerId);
  if (updatedLawyer && updatedLawyer.favorite_count && updatedLawyer.favorite_count < 0) {
    await LawyerProfileModel.findByIdAndUpdate(lawyerId, {
      favorite_count: 0,
    });
  }

  return {
    message: 'Lawyer removed from saved list successfully',
    lawyerId,
  };
};

const getMySavedLawyers = async (decodedUser: JwtPayload) => {
  // Get client profile with populated saved lawyers
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId })
    .populate({
      path: 'savedLawyers',
      populate: [
        { path: 'userId', select: 'name email profile' },
        { path: 'specialties', select: 'name' },
        { path: 'categories', select: 'name slug icon' },
      ]
    });

  if (!client) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Client profile not found');
  }

  return {
    savedLawyers: client.savedLawyers || [],
    totalSaved: client.savedLawyers?.length || 0,
  };
};


// ===== ADMIN FUNCTIONS =====

const adminGetAllLawyers = async (query: Record<string, string>) => {
  const lawyers = LawyerProfileModel.find()
    .populate('userId', 'email profilePhoto isActive isVerified isDeleted createdAt phoneNo')
    .populate('specialties', 'title')
    .populate('categories', 'name slug')
    .select('-walletId -withdrawals -reviews -work_experience -favorite_count -services -lawyerDetails.bar_council_certificate');

  const queryBuilder = new QueryBuilder(lawyers, query);
  const result = queryBuilder.search(lawyerSearchableFields).filter().sort().paginate();

  const [data, meta] = await Promise.all([result.build().exec(), queryBuilder.getMeta()]);
  return { data, meta };
};

const adminBanLawyer = async (lawyerId: string) => {
  const profile = await LawyerProfileModel.findById(lawyerId);
  if (!profile) throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');

  const user = await UserModel.findById(profile.userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

  const newStatus =
    user.isActive === EIsActive.BLOCKED ? EIsActive.ACTIVE : EIsActive.BLOCKED;

  await UserModel.findByIdAndUpdate(profile.userId, { isActive: newStatus });
  return { userId: profile.userId, isActive: newStatus };
};

const adminVerifyLawyer = async (lawyerId: string) => {
  const profile = await LawyerProfileModel.findById(lawyerId);
  if (!profile) throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');

  const user = await UserModel.findById(profile.userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

  const newVerified = !user.isVerified;
  const newActive = newVerified ? EIsActive.ACTIVE : EIsActive.INACTIVE;
  await UserModel.findByIdAndUpdate(profile.userId, {
    isVerified: newVerified,
    isActive: newActive,
  });
  return { userId: profile.userId, isVerified: newVerified, isActive: newActive };
};

const adminDeleteLawyer = async (lawyerId: string) => {
  const profile = await LawyerProfileModel.findById(lawyerId);
  if (!profile) throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');

  await UserModel.findByIdAndUpdate(profile.userId, { isDeleted: true });
  await LawyerProfileModel.findByIdAndDelete(lawyerId);
  return { deleted: true };
};

const adminUpdateLawyer = async (lawyerId: string, payload: Partial<ILawyerProfile>) => {
  const profile = await LawyerProfileModel.findById(lawyerId);
  if (!profile) throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');

  return LawyerProfileModel.findByIdAndUpdate(lawyerId, payload, { new: true })
    .populate('userId', 'email profilePhoto isActive isVerified phoneNo')
    .populate('specialties', 'title')
    .populate('categories', 'name slug');
};

const adminGetLawyerProfile = async (lawyerId: string) => {
  return LawyerProfileModel.findById(lawyerId).select('userId');
};

export const lawyerServices = {
  getPopularLawyers,
  getAllLawyers,
  updateLawyer,
  getLawyerById,
  saveLawyerByClient,
  removeSavedLawyer,
  getMySavedLawyers,
  adminGetAllLawyers,
  adminBanLawyer,
  adminVerifyLawyer,
  adminDeleteLawyer,
  adminUpdateLawyer,
};