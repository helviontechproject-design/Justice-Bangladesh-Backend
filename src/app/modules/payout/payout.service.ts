import { Payout } from "./payout.model";
import { WalletModel } from "../wallet/wallet.model";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes as httpStatus } from "http-status-codes";
import { PayoutStatus } from "./payout.interface";
import { settingsService } from "../settings/settings.service";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { NotificationHelper } from "../notification/notification.helper";
import { UserModel } from "../user/user.model";
import { LawyerProfileModel } from "../lawyer/lawyer.model";

const requestPayout = async (lawyerUserId: string, payload: any) => {
  const lawyerProfile = await LawyerProfileModel.findOne({
    userId: lawyerUserId,
  });

  if (!lawyerProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Lawyer not found");
  }

  const lawyerId = lawyerProfile?._id;

  // Get guide's wallet
  const wallet = await WalletModel.findOne({ lawyerId });

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  }

  // Get platform settings for validation
  const settings = await settingsService.getPlatformSettings();

  // Check if requested amount is available
  if (payload.amount > wallet.balance) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Insufficient balance. Available: ${wallet.balance} BDT, Requested: ${payload.amount} BDT`,
    );
  }

  // Check minimum payout amount from settings
  if (payload.amount < settings.payout.minimumAmount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Minimum payout amount is ${settings.payout.minimumAmount} BDT`,
    );
  }

  // Calculate platform fee — use lawyer's individual fee if set, else global settings
  let platformFeePercent: number;
  if (lawyerProfile.platform_fee_percentage !== null && lawyerProfile.platform_fee_percentage !== undefined) {
    platformFeePercent = lawyerProfile.platform_fee_percentage;
  } else {
    const settings = await settingsService.getPlatformSettings();
    platformFeePercent = settings.platformFee.enabled ? settings.platformFee.percentage : 0;
  }
  const platformFee = Math.round((payload.amount * platformFeePercent) / 100);
  const netAmount = payload.amount - platformFee;

  // Create payout request with fee breakdown
  const payout = await Payout.create({
    ...payload,
    lawyerId,
    platformFee,
    netAmount,
    currency: "BDT",
    requestedAt: new Date(),
  });

  // Deduct requested amount from wallet balance (move to pending)
  wallet.balance -= payload.amount;
  wallet.payableBalance -= payload.amount;
  wallet.pendingBalance += payload.amount;

  // Track total platform fee
  wallet.totalPlatformFee = (wallet.totalPlatformFee || 0) + platformFee;

  await wallet.save();

  // Get guide info for notification
  const guide = await UserModel.findById(lawyerId).select("name");

  // Send notification to admin
  if (guide) {
    await NotificationHelper.notifyPayoutRequested(payout, guide);
  }

  return payout;
};

const processPayout = async (id: string, providerPayoutId?: string) => {
  const payout = await Payout.findById(id);

  if (!payout) {
    throw new AppError(httpStatus.NOT_FOUND, "Payout not found");
  }

  if (payout.status !== PayoutStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only pending payouts can be processed",
    );
  }

  // Get wallet to deduct from pending balance
  const wallet = await WalletModel.findOne({ lawyerId: payout.lawyerId });

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  }

  // Update payout status
  payout.status = PayoutStatus.SENT;
  payout.processedAt = new Date();
  if (providerPayoutId) {
    payout.providerPayoutId = providerPayoutId;
  }
  await payout.save();

  // Deduct requested amount from pending balance (not netAmount)
  wallet.pendingBalance = Math.max(0, wallet.pendingBalance - payout.amount);
  wallet.totalReceived = (wallet.totalReceived || 0) + payout.netAmount;

  await wallet.save();

  // Note: Guide receives netAmount (amount - platformFee)
  // Platform keeps the platformFee

  // Send notification to guide
  await NotificationHelper.notifyPayoutProcessed(payout);

  return payout;
};

const failPayout = async (id: string, failureReason: string) => {
  const payout = await Payout.findById(id);

  if (!payout) {
    throw new AppError(httpStatus.NOT_FOUND, "Payout not found");
  }

  if (payout.status !== PayoutStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only pending payouts can be failed",
    );
  }

  // Get wallet to return amount to balance
  const wallet = await WalletModel.findOne({ lawyerId: payout.lawyerId });

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  }

  // Update payout status
  payout.status = PayoutStatus.FAILED;
  payout.failureReason = failureReason;
  payout.processedAt = new Date();
  await payout.save();

  // Return FULL amount to balance from pending (refund platform fee too)
  wallet.balance += payout.amount;
  wallet.pendingBalance = Math.max(0, wallet.pendingBalance - payout.amount);

  // Refund platform fee since payout failed
  wallet.totalPlatformFee = Math.max(
    0,
    wallet.totalPlatformFee - payout.platformFee,
  );

  await wallet.save();

  // Send notification to guide
  await NotificationHelper.notifyPayoutFailed(payout);

  return payout;
};

const cancelPayout = async (id: string, lawyerUserId: string, reason?: string) => {
  const payout = await Payout.findById(id);

  if (!payout) {
    throw new AppError(httpStatus.NOT_FOUND, "Payout not found");
  }

  const lawyerProfile = await LawyerProfileModel.findOne({ userId: lawyerUserId });
  if (!lawyerProfile) throw new AppError(httpStatus.NOT_FOUND, 'Lawyer not found');

  if (payout.lawyerId.toString() !== lawyerProfile._id.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only cancel your own payouts",
    );
  }

  if (payout.status !== PayoutStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only pending payouts can be cancelled",
    );
  }

  // Get wallet to return amount to balance
  const wallet = await WalletModel.findOne({ lawyerId: payout.lawyerId });

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  }

  // Update payout status
  payout.status = PayoutStatus.CANCELLED;
  if (reason) payout.failureReason = reason;
  await payout.save();

  // Return FULL amount to balance from pending (refund platform fee too)
  wallet.balance += payout.amount;
  wallet.payableBalance += payout.amount;
  wallet.pendingBalance = Math.max(0, wallet.pendingBalance - payout.amount);

  // Refund platform fee since payout cancelled
  wallet.totalPlatformFee = Math.max(
    0,
    wallet.totalPlatformFee - payout.platformFee,
  );

  await wallet.save();

  // Send notification to guide
  await NotificationHelper.notifyPayoutCancelled(payout);

  return payout;
};

const getAllPayouts = async (query: Record<string, string>) => {
  const payoutSearchableFields = [
    "paymentMethod",
    "status",
    "currency",
    "lawyerId",
  ];
  const payoutQuery = new QueryBuilder(
    Payout.find().populate({
      path: 'lawyerId',
      select: 'profile_Details userId',
      populate: { path: 'userId', select: 'profilePhoto phoneNo' },
    }),
    query,
  )
    .search(payoutSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    payoutQuery.build().exec(),
    payoutQuery.getMeta(),
  ]);

  const statsData = await Payout.aggregate([
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$netAmount" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        totalAmount: 1,
        count: 1,
      },
    },
  ]);

  // Create dynamic default structure from enum
  const defaultStats: Record<string, { totalAmount: number; count: number }> =
    {};

  Object.values(PayoutStatus).forEach((status) => {
    defaultStats[status] = { totalAmount: 0, count: 0 };
  });

  // Merge aggregated values into default structure
  statsData.forEach((item) => {
    defaultStats[item.status] = {
      totalAmount: item.totalAmount,
      count: item.count,
    };
  });

  // Final stats object
  const stats = defaultStats;

  return { data, meta: { ...meta, stats } };
};

export const payoutServices = {
  requestPayout,
  getAllPayouts,
  processPayout,
  failPayout,
  cancelPayout,
  getMyPayouts,
};

async function getMyPayouts(lawyerUserId: string) {
  const lawyerProfile = await LawyerProfileModel.findOne({ userId: lawyerUserId });
  if (!lawyerProfile) throw new AppError(httpStatus.NOT_FOUND, 'Lawyer not found');
  return Payout.find({ lawyerId: lawyerProfile._id }).sort({ createdAt: -1 }).limit(20);
}
