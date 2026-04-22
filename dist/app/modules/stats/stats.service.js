"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsService = void 0;
const client_utils_1 = require("./client.utils");
const lawyer_utils_1 = require("./lawyer.utils");
const admin_utils_1 = require("./admin.utils");
// ==================== ADMIN STATISTICS ====================
/**
 * Get complete admin dashboard statistics
 */
const getAdminDashboardStats = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, startDate, endDate } = query;
    const [overview, revenue, appointments, withdrawals, monthlyRevenue, newUsers, topLawyers, recentAppointments,] = yield Promise.all([
        (0, admin_utils_1.getOverviewStats)(),
        (0, admin_utils_1.getRevenueStats)(startDate, endDate),
        (0, admin_utils_1.getAppointmentStats)(startDate, endDate),
        (0, admin_utils_1.getWithdrawalStats)(startDate, endDate),
        (0, admin_utils_1.getMonthlyRevenueTrends)(),
        (0, admin_utils_1.getNewUserStats)(),
        (0, admin_utils_1.getTopLawyers)(10),
        (0, admin_utils_1.getRecentAppointments)(page, limit),
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
});
// ==================== LAWYER STATISTICS ====================
/**
 * Get complete lawyer dashboard statistics
 */
const getLawyerDashboardStats = (lawyerId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, startDate, endDate } = query;
    const [Analytics, todaysSchedule, BookingRequests, appointments, reviews, monthlyAppointments, monthlyEarnings, availability, upcomingAppointments, recentPayments,] = yield Promise.all([
        (0, lawyer_utils_1.getLawyertodaysAnalytics)(lawyerId),
        (0, lawyer_utils_1.getLawyertodaysSchedule)(lawyerId),
        (0, lawyer_utils_1.getLawyerBookingRequests)(lawyerId),
        (0, lawyer_utils_1.getLawyerAppointments)(lawyerId, startDate, endDate),
        (0, lawyer_utils_1.getLawyerReviews)(lawyerId),
        (0, lawyer_utils_1.getLawyerMonthlyAppointments)(lawyerId),
        (0, lawyer_utils_1.getLawyerMonthlyEarnings)(lawyerId),
        (0, lawyer_utils_1.getLawyerAvailability)(lawyerId),
        (0, lawyer_utils_1.getLawyerUpcomingAppointments)(lawyerId, page, limit),
        (0, lawyer_utils_1.getLawyerRecentPayments)(lawyerId, page, limit),
    ]);
    return {
        todaysAnalytics: Analytics,
        todaysSchedule,
        bookingRequests: BookingRequests,
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
});
// ==================== CLIENT STATISTICS ====================
/**
 * Get complete client dashboard statistics
 */
const getClientDashboardStats = (clientId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, startDate, endDate } = query;
    const [appointments, spending, lawyers, monthlyAppointments, upcomingAppointments, completedAppointments, recentPayments,] = yield Promise.all([
        (0, client_utils_1.getClientAppointments)(clientId, startDate, endDate),
        (0, client_utils_1.getClientSpending)(clientId, startDate, endDate),
        (0, client_utils_1.getClientLawyerStats)(clientId),
        (0, client_utils_1.getClientMonthlyAppointments)(clientId),
        (0, client_utils_1.getClientUpcomingAppointments)(clientId, page, limit),
        (0, client_utils_1.getClientCompletedAppointments)(clientId, page, limit),
        (0, client_utils_1.getClientRecentPayments)(clientId, page, limit),
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
});
exports.statsService = {
    // Admin
    getAdminDashboardStats,
    // Lawyer
    getLawyerDashboardStats,
    // Client
    getClientDashboardStats,
};
