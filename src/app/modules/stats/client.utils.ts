
import { Types } from "mongoose";
import { Appointment } from "../appointment/appointment.model";
import { buildDateRangeFilter } from "./stats.utils";
import { Payment } from "../payment/payment.model";
import { PaymentStatus } from "../payment/payment.interface";
import { ClientProfileModel } from "../client/client.model";
import { AppointmentStatus } from "../appointment/appointment.interface";

/**
 * Get client appointments by status
 */
export const getClientAppointments = async (
  clientId: string,
  startDate?: string,
  endDate?: string
) => {
  const dateFilter = buildDateRangeFilter(startDate, endDate, 'createdAt');

  const result = await Appointment.aggregate([
    {
      $match: {
        clientId: new Types.ObjectId(clientId),
        ...dateFilter,
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };

  result.forEach((item) => {
    const status = item._id.toLowerCase();
    stats.total += item.count;
    if (status in stats) {
      stats[status as keyof typeof stats] = item.count;
    }
  });

  return stats;
};

/**
 * Get client spending statistics
 */
export const getClientSpending = async (
  clientId: string,
  startDate?: string,
  endDate?: string
) => {
  const dateFilter = buildDateRangeFilter(startDate, endDate, 'createdAt');

  const result = await Payment.aggregate([
    {
      $match: {
        clientId: new Types.ObjectId(clientId),
        ...dateFilter,
      },
    },
    {
      $group: {
        _id: '$status',
        amount: { $sum: '$amount' },
      },
    },
  ]);

  let totalSpent = 0;
  let pendingPayments = 0;
  let completedPayments = 0;

  result.forEach((item) => {
    if (item._id === PaymentStatus.PAID) {
      completedPayments = item.amount;
      totalSpent += item.amount;
    } else if (item._id === PaymentStatus.UNPAID) {
      pendingPayments = item.amount;
      totalSpent += item.amount;
    }
  });

  return {
    totalSpent,
    pendingPayments,
    completedPayments,
  };
};

/**
 * Get client lawyer statistics
 */
export const getClientLawyerStats = async (clientId: string) => {
  const uniqueLawyers = await Appointment.distinct('lawyerId', {
    clientId: new Types.ObjectId(clientId),
  });

  const clientProfile = await ClientProfileModel.findById(clientId).lean();

  return {
    uniqueLawyersConsulted: uniqueLawyers.length,
    savedLawyers: clientProfile?.savedLawyers?.length || 0,
  };
};

/**
 * Get client monthly appointment trends
 */
export const getClientMonthlyAppointments = async (
  clientId: string,
  year?: number
) => {
  const currentYear = year || new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const result = await Appointment.aggregate([
    {
      $match: {
        clientId: new Types.ObjectId(clientId),
        createdAt: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
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
        count: 1,
      },
    },
  ]);

  return result;
};

/**
 * Get client upcoming appointments with pagination
 */
export const getClientUpcomingAppointments = async (
  clientId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [data, total] = await Promise.all([
    Appointment.find({
      clientId: clientId,
      // appointmentDate: { $gte: today },
    })
      .populate('lawyerId', 'profile_Details')
      .sort({ appointmentDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments({
      clientId: new Types.ObjectId(clientId),
      // appointmentDate: { $gte: today },
    }),
  ]);

  // const meta = buildPaginationMeta(total, page, limit);

  return { data };
};

/**
 * Get client completed appointments with pagination
 */
export const getClientCompletedAppointments = async (
  clientId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Appointment.find({
      clientId: new Types.ObjectId(clientId),
      status: AppointmentStatus.COMPLETED,
    })
      .populate('lawyerId', 'profile_Details')
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments({
      clientId: new Types.ObjectId(clientId),
      status: AppointmentStatus.COMPLETED,
    }),
  ]);

  // const meta = buildPaginationMeta(total, page, limit);

  return { data };
};

/**
 * Get client recent payments with pagination
 */
export const getClientRecentPayments = async (
  clientId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Payment.find({ clientId: new Types.ObjectId(clientId) })
      .populate('lawyerId', 'profile_Details')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments({ clientId: new Types.ObjectId(clientId) }),
  ]);

  // const meta = buildPaginationMeta(total, page, limit);

  return { data };
};