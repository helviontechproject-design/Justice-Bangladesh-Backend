import { Appointment } from "../appointment/appointment.model";
import { LawyerProfileModel } from "../lawyer/lawyer.model";
import { PaymentStatus } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { PayoutStatus } from "../payout/payout.interface";
import { Payout } from "../payout/payout.model";
import { ERole } from "../user/user.interface";
import { UserModel } from "../user/user.model";
import { buildDateRangeFilter, getCurrentMonthRange } from "./stats.utils";

/**
 * Get overview statistics (total counts)
 */
export const getOverviewStats = async () => {
  const result = await UserModel.aggregate([
    {
      $facet: {
        totalUsers: [
          { $match: { isDeleted: false } },
          { $count: 'count' },
        ],
        totalLawyers: [
          { $match: { isDeleted: false, role: ERole.LAWYER } },
          { $count: 'count' },
        ],
        totalClients: [
          { $match: { isDeleted: false, role: ERole.CLIENT } },
          { $count: 'count' },
        ],
      },
    },
  ]);

  const totalAppointments = await Appointment.countDocuments();
  const totalPayments = await Payment.countDocuments();

  return {
    totalUsers: result[0]?.totalUsers[0]?.count || 0,
    totalLawyers: result[0]?.totalLawyers[0]?.count || 0,
    totalClients: result[0]?.totalClients[0]?.count || 0,
    totalAppointments,
    totalPayments,
  };
};

/**
 * Get revenue statistics
 */
export const getRevenueStats = async (startDate?: string, endDate?: string) => {
  const dateFilter = buildDateRangeFilter(startDate, endDate, 'createdAt');

  const result = await Payment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$status',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalRevenue = 0;
  let pendingPayments = 0;
  let completedPayments = 0;

  result.forEach((item) => {
    if (item._id === PaymentStatus.PAID) {
      completedPayments = item.total;
      totalRevenue += item.total;
    } else if (item._id === PaymentStatus.UNPAID) {
      pendingPayments = item.total;
    }
  });

  return {
    totalRevenue,
    pendingPayments,
    completedPayments,
  };
};

/**
 * Get appointment statistics by status
 */
export const getAppointmentStats = async (startDate?: string, endDate?: string) => {
  const dateFilter = buildDateRangeFilter(startDate, endDate, 'createdAt');

  const result = await Appointment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
  };

  result.forEach((item) => {
    const status = item._id.toLowerCase();
    if (status in stats) {
      stats[status as keyof typeof stats] = item.count;
    }
  });

  return stats;
};

/**
 * Get withdrawal statistics
 */
export const getWithdrawalStats = async (startDate?: string, endDate?: string) => {
  
  let totalWithdrawals = 0;
  let pendingWithdrawals = 0;
  let approvedWithdrawals = 0;
  let totalWithdrawnAmount = 0;



  return {
    totalWithdrawals,
    pendingWithdrawals,
    approvedWithdrawals,
    totalWithdrawnAmount,
  };
};

/**
 * Get monthly revenue trends for current year
 */
export const getMonthlyRevenueTrends = async (year?: number) => {
  const currentYear = year || new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const result = await Payment.aggregate([
    {
      $match: {
        status: PaymentStatus.PAID,
        createdAt: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$amount' },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' },
              ],
            },
          ],
        },
        revenue: 1,
      },
    },
  ]);

  return result;
};

/**
 * Get new user registration stats for current month
 */
export const getNewUserStats = async () => {
  const { start, end } = getCurrentMonthRange();

  const result = await UserModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: start, $lte: end },
        role: { $in: [ERole.LAWYER, ERole.CLIENT] },
      },
    },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  let lawyers = 0;
  let clients = 0;

  result.forEach((item) => {
    if (item._id === ERole.LAWYER) {
      lawyers = item.count;
    } else if (item._id === ERole.CLIENT) {
      clients = item.count;
    }
  });

  return { lawyers, clients };
};

/**
 * Get top-rated lawyers
 */
export const getTopLawyers = async (limit: number = 10) => {
  const result = await LawyerProfileModel.aggregate([
    {
      $lookup: {
        from: 'clientreviews',
        localField: '_id',
        foreignField: 'lawyerId',
        as: 'reviews',
      },
    },
    {
      $lookup: {
        from: 'appointments',
        localField: '_id',
        foreignField: 'lawyerId',
        as: 'appointments',
      },
    },
    {
      $addFields: {
        averageRating: { $avg: '$reviews.rating' },
        totalReviews: { $size: '$reviews' },
        totalAppointments: { $size: '$appointments' },
      },
    },
    {
      $match: {
        totalReviews: { $gt: 0 },
      },
    },
    {
      $sort: { averageRating: -1, totalReviews: -1 },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        lawyerId: { $toString: '$_id' },
        name: {
          $concat: [
            '$profile_Details.first_name',
            ' ',
            '$profile_Details.last_name',
          ],
        },
        averageRating: { $round: ['$averageRating', 2] },
        totalReviews: 1,
        totalAppointments: 1,
        _id: 0,
      },
    },
  ]);

  return result;
};

/**
 * Get recent appointments with pagination
 */
export const getRecentAppointments = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Appointment.find()
      .populate('clientId', 'profileInfo')
      .populate('lawyerId', 'profile_Details')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(),
  ]);

  // const meta = buildPaginationMeta(total, page, limit);

  return { data };
};
