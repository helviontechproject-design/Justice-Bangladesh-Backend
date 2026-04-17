import { JwtPayload } from 'jsonwebtoken';
import { UserModel } from './user.model';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes } from 'http-status-codes';
import { IUser } from './user.interface';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { userSearchableFields } from '../../constants';
import { NotificationHelper } from '../notification/notification.helper';

const getMe = async (decodedUser: JwtPayload) => {
  const me = await UserModel.findById(decodedUser.userId).populate([
    { path: 'client' },
    { path: 'lawyer', populate: { path: 'specialties', select: 'title icon' } },
  ]);

  if (!me) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (me.phoneNo?.isVerified !== true) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'User not verified! Please verify your phone number.'
    );
  }

  return me;
};

const getAllUsers = async (
  decodedUser: JwtPayload,
  query: Record<string, string>
) => {
  const SUPER_ADMIN = await UserModel.findById(decodedUser.userId);

  if (!SUPER_ADMIN) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'You are not authorized to access this resource'
    );
  }

  const users = UserModel.find().populate('lawyer client');

  const queryBuilder = new QueryBuilder(users, query);

  const allUsers = queryBuilder
    .search(userSearchableFields)
    .filter()
    .paginate();

  const [data, meta] = await Promise.all([
    allUsers.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};



const updateUser = async (decodedUser: JwtPayload, payload: Partial<IUser>) => {
  const user = await UserModel.findById(decodedUser.userId).populate(
    'lawyer client'
  );

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user.phoneNo?.isVerified !== true) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'User not verified! Please verify your phone number.'
    );
  }

  // Check if status is being changed
  const oldStatus = user.isActive;
  const newStatus = payload.isActive;

  const updatedUser = await UserModel.findByIdAndUpdate(
    decodedUser.userId,
    payload,
    { new: true }
  );

  // Send notification if status changed
  if (newStatus && oldStatus !== newStatus) {
    try {
      await NotificationHelper.notifyAccountStatusChanged(
        user._id,
        newStatus
      );
    } catch (error) {
      console.error('Error sending status change notification:', error);
    }
  }

  return updatedUser;
};






export const userServices = {
  getMe,
  getAllUsers,
  updateUser,
};
