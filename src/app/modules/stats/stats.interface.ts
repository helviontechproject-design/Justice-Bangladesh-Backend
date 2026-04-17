import { Types } from 'mongoose';

// Pagination metadata
export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Admin Dashboard Statistics
export interface IAdminStats {
  overview: {
    totalUsers: number;
    totalLawyers: number;
    totalClients: number;
    totalAppointments: number;
    totalPayments: number;
  };
  revenue: {
    totalRevenue: number;
    pendingPayments: number;
    completedPayments: number;
  };
  appointments: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    rejected: number;
  };
  withdrawals: {
    totalWithdrawals: number;
    pendingWithdrawals: number;
    approvedWithdrawals: number;
    totalWithdrawnAmount: number;
  };
  trends: {
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    newUsers: {
      lawyers: number;
      clients: number;
    };
  };
  topLawyers: Array<{
    lawyerId: string;
    name: string;
    averageRating: number;
    totalReviews: number;
    totalAppointments: number;
  }>;
  recentAppointments: {
    data: Array<any>;
    meta?: IPaginationMeta;
  };
}

// Lawyer Dashboard Statistics
export interface ILawyerStats {
  Analytics: any;
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
  trends: {
    monthlyAppointments: Array<{ month: string; count: number }>;
    monthlyEarnings: Array<{ month: string; earnings: number }>;
  };
  availability: {
    totalSlots: number;
    bookedSlots: number;
    availableSlots: number;
  };
  upcomingAppointments: {
    data: Array<any>;
    meta?: IPaginationMeta;
  };
  recentPayments: {
    data: Array<any>;
    meta?: IPaginationMeta;
  };
}

// Client Dashboard Statistics
export interface IClientStats {
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  spending: {
    totalSpent: number;
    pendingPayments: number;
    completedPayments: number;
  };
  lawyers: {
    uniqueLawyersConsulted: number;
    savedLawyers: number;
  };
  trends: {
    monthlyAppointments: Array<{ month: string; count: number }>;
  };
  upcomingAppointments: {
    data: Array<any>;
    meta?: IPaginationMeta;
  };
  completedAppointments: {
    data: Array<any>;
    meta?: IPaginationMeta;
  };
  recentPayments: {
    data: Array<any>;
    meta?: IPaginationMeta;
  };
}

// Query parameters
export interface IStatsQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// Date range filter result
export interface IDateRangeFilter {
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  appointmentDate?: {
    $gte?: Date;
    $lte?: Date;
  };
}
