
import {
  IAdminStats,
  IClientStats,
  IStatsQuery,
} from './stats.interface';

import { getClientAppointments, getClientCompletedAppointments, getClientLawyerStats, getClientMonthlyAppointments, getClientRecentPayments, getClientSpending, getClientUpcomingAppointments } from './client.utils';
import {  getLawyerAppointments, getLawyerAvailability,getLawyerBookingRequests,getLawyerMonthlyAppointments, getLawyerMonthlyEarnings, getLawyerRecentPayments, getLawyerReviews, getLawyertodaysAnalytics, getLawyertodaysSchedule, getLawyerUpcomingAppointments } from './lawyer.utils';
import { getAppointmentStats, getMonthlyRevenueTrends, getNewUserStats, getOverviewStats, getRecentAppointments, getRevenueStats, getTopLawyers, getWithdrawalStats } from './admin.utils';

// ==================== ADMIN STATISTICS ====================

/**
 * Get complete admin dashboard statistics
 */
const getAdminDashboardStats = async (
  query: IStatsQuery
): Promise<IAdminStats> => {
  const { page = 1, limit = 10, startDate, endDate } = query;

  const [
    overview,
    revenue,
    appointments,
    withdrawals,
    monthlyRevenue,
    newUsers,
    topLawyers,
    recentAppointments,
  ] = await Promise.all([
    getOverviewStats(),
    getRevenueStats(startDate, endDate),
    getAppointmentStats(startDate, endDate),
    getWithdrawalStats(startDate, endDate),
    getMonthlyRevenueTrends(),
    getNewUserStats(),
    getTopLawyers(10),
    getRecentAppointments(page, limit),
  ]);

  return {
    overview,
    revenue,
    appointments,
    withdrawals,
    trends: {
      monthlyRevenue,
      newUsers,
    },
    topLawyers,
    recentAppointments,
  };
};

// ==================== LAWYER STATISTICS ====================

/**
 * Get complete lawyer dashboard statistics
 */
const getLawyerDashboardStats = async (
  lawyerId: string,
  query: IStatsQuery
) => {
  const { page = 1, limit = 10, startDate, endDate } = query;

  const [
    Analytics,
    todaysSchedule,
    BookingRequests,
    appointments,
    reviews,
    monthlyAppointments,
    monthlyEarnings,
    availability,
    upcomingAppointments,
    recentPayments,
  ] = await Promise.all([
    getLawyertodaysAnalytics(lawyerId),
    getLawyertodaysSchedule(lawyerId),
    getLawyerBookingRequests(lawyerId),
    getLawyerAppointments(lawyerId, startDate, endDate),
    getLawyerReviews(lawyerId),
    getLawyerMonthlyAppointments(lawyerId),
    getLawyerMonthlyEarnings(lawyerId),
    getLawyerAvailability(lawyerId),
    getLawyerUpcomingAppointments(lawyerId, page, limit),
    getLawyerRecentPayments(lawyerId, page, limit),
  ]);

  return {
    Analytics,
    todaysSchedule,
    BookingRequests,
    appointments,
    reviews,
    trends: {
      monthlyAppointments,
      monthlyEarnings,
    },
    availability,
    upcomingAppointments,
    recentPayments,
  };
};

// ==================== CLIENT STATISTICS ====================



/**
 * Get complete client dashboard statistics
 */
const getClientDashboardStats = async (
  clientId: string,
  query: IStatsQuery
): Promise<IClientStats> => {
  const { page = 1, limit = 10, startDate, endDate } = query;

  const [
    appointments,
    spending,
    lawyers,
    monthlyAppointments,
    upcomingAppointments,
    completedAppointments,
    recentPayments,
  ] = await Promise.all([
    getClientAppointments(clientId, startDate, endDate),
    getClientSpending(clientId, startDate, endDate),
    getClientLawyerStats(clientId),
    getClientMonthlyAppointments(clientId),
    getClientUpcomingAppointments(clientId, page, limit),
    getClientCompletedAppointments(clientId, page, limit),
    getClientRecentPayments(clientId, page, limit),
  ]);

  return {
    appointments,
    spending,
    lawyers,
    trends: {
      monthlyAppointments,
    },
    upcomingAppointments,
    completedAppointments,
    recentPayments,
  };
};

export const statsService = {
  // Admin
  getAdminDashboardStats,
  // Lawyer
  getLawyerDashboardStats,
  // Client
  getClientDashboardStats,
};
