import { Types } from "mongoose";
import { buildDateRangeFilter, formatMonthString } from "./stats.utils";
import { Appointment } from "../appointment/appointment.model";
import { ClientReview } from "../review/review.model";
import { Payment } from "../payment/payment.model";
import { PaymentStatus } from "../payment/payment.interface";
import { AvailabilityModel } from "../availability/availability.model";
import { ILawyerStats, IStatsQuery } from "./stats.interface";
import { AppointmentStatus } from "../appointment/appointment.interface";

/**
 * Get lawyer today's analytics (appointments, pending requests, earnings)
 */
export const getLawyertodaysAnalytics = async (lawyerId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todaysAppointments, pendingAppointments, todaysEarnings] = await Promise.all([
    Appointment.countDocuments({
      lawyerId: new Types.ObjectId(lawyerId),
      createdAt: { $gte: today, $lt: tomorrow },
    }),
    Appointment.countDocuments({
      lawyerId: new Types.ObjectId(lawyerId),
      status: AppointmentStatus.PENDING,
    }),
    Payment.aggregate([
      {
        $match: {
          lawyerId: new Types.ObjectId(lawyerId),
          status: PaymentStatus.PAID,
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  return {
    todaysAppointments: todaysAppointments || 0,
    allPendingRequests: pendingAppointments || 0,
    earningsToday: todaysEarnings[0]?.total || 0,
  };
};

export const getLawyertodaysSchedule = async (lawyerId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysSchedule = await Appointment.find({
    lawyerId: new Types.ObjectId(lawyerId),
    appointmentDate: { $gte: today, $lt: tomorrow },
    status: AppointmentStatus.CONFIRMED,
  })
    .populate('clientId', 'profileInfo email')
    .sort({ selectedTime: 1 })
    .lean();
  
  console.log(todaysSchedule);
  

  return todaysSchedule;
};

export const getLawyerBookingRequests = async (lawyerId: string) => {
  const now = new Date();

  const bookingRequests = await Appointment.find({
    lawyerId: new Types.ObjectId(lawyerId),
    status: AppointmentStatus.PENDING,
    appointmentDate: { $gte: now }, // Only future appointments (not expired)
  })
    .populate('clientId', 'profileInfo email')
    .sort({ createdAt: -1 }) // Latest requests first
    .lean()

  return bookingRequests;
};

/**
 * Get lawyer appointments by status
 */
export const getLawyerAppointments = async (
  lawyerId: string,
  startDate?: string,
  endDate?: string
) => {
  const dateFilter = buildDateRangeFilter(startDate, endDate, 'createdAt');

  const result = await Appointment.aggregate([
    {
      $match: {
        lawyerId: new Types.ObjectId(lawyerId),
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
 * Get lawyer reviews statistics
 */
export const getLawyerReviews = async (lawyerId: string) => {
  const result = await ClientReview.aggregate([
    {
      $match: {
        lawyerId: new Types.ObjectId(lawyerId),
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
    };
  }

  return {
    averageRating: Math.round(result[0].averageRating * 100) / 100,
    totalReviews: result[0].totalReviews,
  };
};

/**
 * Get lawyer monthly appointment trends
 */
export const getLawyerMonthlyAppointments = async (
  lawyerId: string,
  year?: number
) => {
  const currentYear = year || new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const result = await Appointment.aggregate([
    {
      $match: {
        lawyerId: new Types.ObjectId(lawyerId),
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
 * Get lawyer monthly earnings trends
 */
export const getLawyerMonthlyEarnings = async (lawyerId: string, year?: number) => {
  const currentYear = year || new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const result = await Payment.aggregate([
    {
      $match: {
        lawyerId: new Types.ObjectId(lawyerId),
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
        earnings: { $sum: '$amount' },
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
        earnings: 1,
      },
    },
  ]);

  return result;
};

/**
 * Get lawyer availability statistics
 */
export const getLawyerAvailability = async (lawyerId: string) => {
  const now = new Date();
  const currentMonth = formatMonthString(now.getFullYear(), now.getMonth() + 1);

  const availability = await AvailabilityModel.findOne({
    lawyerId: new Types.ObjectId(lawyerId),
    month: currentMonth,
  }).lean();

  if (!availability) {
    return {
      totalSlots: 0,
      bookedSlots: 0,
      availableSlots: 0,
    };
  }

  let totalSlots = 0;
  let bookedSlots = 0;

  availability.availableDates.forEach((date) => {
    date.schedules.forEach((schedule) => {
      totalSlots++;
      if (schedule.isBooked || schedule.status === 'booked') {
        bookedSlots++;
      }
    });
  });

  return {
    totalSlots,
    bookedSlots,
    availableSlots: totalSlots - bookedSlots,
  };
};

/**
 * Get lawyer upcoming appointments with pagination
 */
export const getLawyerUpcomingAppointments = async (
  lawyerId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;
  const today = new Date();
  // today.setHours(0, 0, 0, 0);

  const [data, total] = await Promise.all([
    Appointment.find({
      lawyerId: new Types.ObjectId(lawyerId),
      // appointmentDate: { $gte: today },
    })
      .populate('clientId', 'profileInfo')
      .sort({ appointmentDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments({
      lawyerId: new Types.ObjectId(lawyerId),
      // appointmentDate: { $gte: today },
    }),
  ]);

  // const meta = buildPaginationMeta(total, page, limit);

  return { data };
};

/**
 * Get lawyer recent payments with pagination
 */
export const getLawyerRecentPayments = async (
  lawyerId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Payment.find({ lawyerId: new Types.ObjectId(lawyerId) })
      .populate('clientId', 'profileInfo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments({ lawyerId: new Types.ObjectId(lawyerId) }),
  ]);

  // const meta = buildPaginationMeta(total, page, limit);

  return { data };
};

