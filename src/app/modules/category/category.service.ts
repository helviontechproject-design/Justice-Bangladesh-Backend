import { JwtPayload } from 'jsonwebtoken';
import { ICategory } from './category.interface';
import CategoryModel from './category.model';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { QueryBuilder } from '../../utils/QueryBuilder';


const createCategory = async (payload: ICategory, decodedUser: JwtPayload) => {
  const userCheck = await CategoryModel.findById(decodedUser.userId);
  if (userCheck) {
    throw new AppError(StatusCodes.CONFLICT, 'Category already exists');
  }
  const category = await CategoryModel.create(payload);
  return category;
};


const getAllCategories = async (query: Record<string, string>) => {
  const categories = CategoryModel.find();
  const queryBuilder = new QueryBuilder(categories, query);
  const allCategories = queryBuilder.filter().sort().paginate();

  const [data, meta] = await Promise.all([
    allCategories.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};


const getSingleCategory = async (id: string) => {
  const category = await CategoryModel.findOne({
    $or: [{ _id: id }, { slug: id }],
  });
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
  }
  return category;
};


const updateCategory = async (
  id: string,
  payload: Partial<ICategory>,
  decodedUser: JwtPayload
) => {
  const category = await CategoryModel.findById(id);
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  const updated = await CategoryModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return updated;
};


const deleteCategory = async (id: string, decodedUser: JwtPayload) => {
  const category = await CategoryModel.findById(id);
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  await CategoryModel.findByIdAndDelete(id);
  return category;
};

export const categoryServices = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};
