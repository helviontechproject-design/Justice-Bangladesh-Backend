import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { WalletModel } from './wallet.model';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { LawyerProfileModel } from '../lawyer/lawyer.model';
import { IWallet } from './wallet.interface';


const getAllWallets = async (query: Record<string, string>) => {
  const wallets = WalletModel.find()
    .populate('lawyerId', '_id userId profile_Details gender')
    .populate('transactions');

  const queryBuilder = new QueryBuilder(wallets, query);

  const allWallets = queryBuilder
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    allWallets.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getMyWallet = async (decodedUser: JwtPayload) => {
  if (!decodedUser.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized user');
  }

  const lawyer = await LawyerProfileModel.findOne({ userId: decodedUser.userId });

  if (!lawyer) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer profile not found');
  }

  const wallet = await WalletModel.findOne({ lawyerId: lawyer._id })

  if (!wallet) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Wallet not found');
  }

  return wallet;
};

const getWalletById = async (id: string) => {
  const wallet = await WalletModel.findById(id)
    .populate('lawyerId', '_id userId profile_Details')
    .populate('transactions');

  if (!wallet) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Wallet not found');
  }

  return wallet;
};

const getWalletByLawyerId = async (lawyerId: string) => {
  const wallet = await WalletModel.findOne({
    lawyerId: new Types.ObjectId(lawyerId),
  })
    .populate('lawyerId', '_id userId profile_Details')
    .populate('transactions');

  if (!wallet) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Wallet not found for this lawyer');
  }

  return wallet;
};

const updateWallet = async (
  id: string,
  payload: Partial<IWallet>
) => {
  const wallet = await WalletModel.findById(id);

  if (!wallet) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Wallet not found');
  }

  const updatedWallet = await WalletModel.findByIdAndUpdate(
    id,
    payload,
    { new: true }
  ).populate('lawyerId').populate('transactions');

  return updatedWallet;
};





export const walletService = {
  getAllWallets,
  getMyWallet,
  getWalletById,
  getWalletByLawyerId,
  updateWallet
};
