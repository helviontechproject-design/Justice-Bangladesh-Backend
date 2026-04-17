import { JwtPayload } from 'jsonwebtoken';
import { IService } from './service.interface';
import { StatusCodes } from 'http-status-codes';
import { ServiceModel } from './service.model';
import AppError from '../../errorHelpers/AppError';
import { UserModel } from '../user/user.model';
// ✅ Create Service
const createService = async (payload: IService, decodedUser: JwtPayload) => {
  const Service = await ServiceModel.create(payload);
  return Service;
};

// ✅ Get all
const getAllCategories = async () => {
  const categories = await ServiceModel.find({ isActive: true }).sort({ createdAt: -1 });
  return categories;
};

// ✅ Get featured (max 8)
const getFeaturedServices = async () => {
  const services = await ServiceModel.find({ isActive: true, isFeatured: true })
    .sort({ createdAt: -1 })
    .limit(8);
  return services;
};

// ✅ Get single
const getSingleService = async (id: string) => {
  const Service = await ServiceModel.findOne({
    $or: [{ _id: id }, { slug: id }],
  });
  if (!Service) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Service not found');
  }
  return Service;
};

// ✅ Update
const updateService = async (
  id: string,
  payload: Partial<IService>,
  decodedUser: JwtPayload
) => {
  const Service = await ServiceModel.findById(id);
  if (!Service) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Service not found');
  }

  const updated = await ServiceModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return updated;
};

// ✅ Delete
const deleteService = async (id: string, decodedUser: JwtPayload) => {
  const Service = await ServiceModel.findById(id);
  if (!Service) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Service not found');
  }

  await ServiceModel.findByIdAndDelete(id);
  return Service;
};

export const serviceServices = {
  createService,
  getAllCategories,
  getFeaturedServices,
  getSingleService,
  updateService,
  deleteService,
};
