import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { ILawyerSpecialty } from './lawyerSpecialties.interface';
import { LawyerSpecialty } from './lawyerSpecialties.model';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { LawyerProfileModel } from '../lawyer/lawyer.model';

// ── Public ───────────────────────────────────────────────────────────────────

const getAllLawyerSpecialties = async (query: Record<string, string>) => {
  const specialties = LawyerSpecialty.find().populate('category');
  const queryBuilder = new QueryBuilder(specialties, query);
  const result = queryBuilder.search(['title']).filter().paginate();
  const [data, meta] = await Promise.all([result.build().exec(), queryBuilder.getMeta()]);
  return { data, meta };
};

const getSingleLawyerSpecialty = async (id: string) => {
  const specialty = await LawyerSpecialty.findById(id).populate('category');
  if (!specialty) throw new AppError(StatusCodes.NOT_FOUND, 'Specialty not found');
  return specialty;
};

/** GET /lawyer-specialties/by-category/:categoryId */
const getByCategory = async (categoryId: string) => {
  return LawyerSpecialty.find({ category: categoryId })
    .populate('category', 'name slug')
    .sort({ title: 1 });
};

/** GET /lawyer-specialties/suggest?q=keyword — case-insensitive, limit 10 */
const suggestSpecialties = async (q: string) => {
  if (!q || q.trim().length < 1) return [];
  return LawyerSpecialty.find({ title: { $regex: q.trim(), $options: 'i' } })
    .select('title icon category')
    .populate('category', 'name')
    .limit(10)
    .sort({ title: 1 });
};

// ── Lawyer (self) ────────────────────────────────────────────────────────────

const createLawyerSpecialty = async (decodedUser: JwtPayload, payload: Partial<ILawyerSpecialty>) => {
  if (!decodedUser.userId) throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized');

  const lawyer = await LawyerProfileModel.findOne({ userId: decodedUser.userId });
  if (!lawyer) throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer profile not found');

  const existing = await LawyerSpecialty.findOne({ title: payload.title, category: payload.category });
  if (existing && lawyer.specialties?.some(s => s.toString() === (existing._id as any).toString())) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You already added this specialty');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [specialty] = await LawyerSpecialty.create([payload], { session });
    await LawyerProfileModel.findByIdAndUpdate(lawyer._id, { $addToSet: { specialties: specialty._id } }, { session });
    await session.commitTransaction();
    session.endSession();
    return LawyerSpecialty.findById(specialty._id).populate('category');
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed: ${err}`);
  }
};

const updateLawyerSpecialty = async (id: string, decodedUser: JwtPayload, payload: Partial<ILawyerSpecialty>) => {
  const specialty = await LawyerSpecialty.findById(id);
  if (!specialty) throw new AppError(StatusCodes.NOT_FOUND, 'Specialty not found');

  const lawyer = await LawyerProfileModel.findOne({ userId: decodedUser.userId });
  if (!lawyer) throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');
  if (!lawyer.specialties?.some(s => s.toString() === (specialty._id as any).toString())) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You can only update your own specialties');
  }

  return LawyerSpecialty.findByIdAndUpdate(id, payload, { new: true }).populate('category');
};

const deleteLawyerSpecialty = async (id: string, decodedUser: JwtPayload) => {
  const specialty = await LawyerSpecialty.findById(id);
  if (!specialty) throw new AppError(StatusCodes.NOT_FOUND, 'Specialty not found');

  if (decodedUser.role === 'LAWYER') {
    const lawyer = await LawyerProfileModel.findOne({ userId: decodedUser.userId });
    if (!lawyer) throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');
    if (!lawyer.specialties?.some(s => s.toString() === (specialty._id as any).toString())) {
      throw new AppError(StatusCodes.FORBIDDEN, 'You can only delete your own specialties');
    }
    await LawyerProfileModel.findByIdAndUpdate(lawyer._id, { $pull: { specialties: specialty._id } });
  } else {
    await LawyerProfileModel.updateMany({ specialties: specialty._id }, { $pull: { specialties: specialty._id } });
  }

  await LawyerSpecialty.findByIdAndDelete(id);
};

const getMySpecialties = async (decodedUser: JwtPayload) => {
  if (!decodedUser.userId) throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
  const lawyer = await LawyerProfileModel.findOne({ userId: decodedUser.userId })
    .populate({ path: 'specialties', populate: { path: 'category' } });
  if (!lawyer) throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');
  return lawyer.specialties || [];
};

// ── Admin ────────────────────────────────────────────────────────────────────

/** Admin creates a global specialization linked to a category */
const adminCreateSpecialty = async (payload: { title: string; category: string; icon?: string }) => {
  if (!payload.title || !payload.category) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Title and category are required');
  }
  const exists = await LawyerSpecialty.findOne({ title: { $regex: `^${payload.title}$`, $options: 'i' }, category: payload.category });
  if (exists) throw new AppError(StatusCodes.CONFLICT, 'Specialization already exists in this category');

  return LawyerSpecialty.create({
    title: payload.title,
    category: payload.category,
    icon: payload.icon || '',
  });
};

const adminUpdateSpecialty = async (id: string, payload: Partial<ILawyerSpecialty>) => {
  const specialty = await LawyerSpecialty.findById(id);
  if (!specialty) throw new AppError(StatusCodes.NOT_FOUND, 'Specialty not found');
  return LawyerSpecialty.findByIdAndUpdate(id, payload, { new: true }).populate('category');
};

const adminDeleteSpecialty = async (id: string) => {
  const specialty = await LawyerSpecialty.findById(id);
  if (!specialty) throw new AppError(StatusCodes.NOT_FOUND, 'Specialty not found');
  await LawyerProfileModel.updateMany({ specialties: specialty._id }, { $pull: { specialties: specialty._id } });
  await LawyerSpecialty.findByIdAndDelete(id);
};

export const lawyerSpecialtyService = {
  getAllLawyerSpecialties,
  getSingleLawyerSpecialty,
  getByCategory,
  suggestSpecialties,
  createLawyerSpecialty,
  updateLawyerSpecialty,
  deleteLawyerSpecialty,
  getMySpecialties,
  adminCreateSpecialty,
  adminUpdateSpecialty,
  adminDeleteSpecialty,
};
