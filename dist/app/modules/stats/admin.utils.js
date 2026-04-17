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
exports.getRecentAppointments = exports.getTopLawyers = exports.getNewUserStats = exports.getMonthlyRevenueTrends = exports.getWithdrawalStats = exports.getAppointmentStats = exports.getRevenueStats = exports.getOverviewStats = void 0;
const appointment_model_1 = require("../appointment/appointment.model");
const lawyer_model_1 = require("../lawyer/lawyer.model");
const payment_interface_1 = require("../payment/payment.interface");
const payment_model_1 = require("../payment/payment.model");
const user_interface_1 = require("../user/user.interface");
const user_model_1 = require("../user/user.model");
const stats_utils_1 = require("./stats.utils");
/**
 * Get overview statistics (total counts)
 */
const getOverviewStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const result = yield user_model_1.UserModel.aggregate([
        {
            $facet: {
                totalUsers: [
                    { $match: { isDeleted: false } },
                    { $count: 'count' },
                ],
                totalLawyers: [
                    { $match: { isDeleted: false, role: user_interface_1.ERole.LAWYER } },
                    { $count: 'count' },
                ],
                totalClients: [
                    { $match: { isDeleted: false, role: user_interface_1.ERole.CLIENT } },
                    { $count: 'count' },
                ],
            },
        },
    ]);
    const totalAppointments = yield appointment_model_1.Appointment.countDocuments();
    const totalPayments = yield payment_model_1.Payment.countDocuments();
    return {
        totalUsers: ((_b = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.totalUsers[0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
        totalLawyers: ((_d = (_c = result[0]) === null || _c === void 0 ? void 0 : _c.totalLawyers[0]) === null || _d === void 0 ? void 0 : _d.count) || 0,
        totalClients: ((_f = (_e = result[0]) === null || _e === void 0 ? void 0 : _e.totalClients[0]) === null || _f === void 0 ? void 0 : _f.count) || 0,
        totalAppointments,
        totalPayments,
    };
});
exports.getOverviewStats = getOverviewStats;
/**
 * Get revenue statistics
 */
const getRevenueStats = (startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    const dateFilter = (0, stats_utils_1.buildDateRangeFilter)(startDate, endDate, 'createdAt');
    const result = yield payment_model_1.Payment.aggregate([
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
        if (item._id === payment_interface_1.PaymentStatus.PAID) {
            completedPayments = item.total;
            totalRevenue += item.total;
        }
        else if (item._id === payment_interface_1.PaymentStatus.UNPAID) {
            pendingPayments = item.total;
        }
    });
    return {
        totalRevenue,
        pendingPayments,
        completedPayments,
    };
});
exports.getRevenueStats = getRevenueStats;
/**
 * Get appointment statistics by status
 */
const getAppointmentStats = (startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    const dateFilter = (0, stats_utils_1.buildDateRangeFilter)(startDate, endDate, 'createdAt');
    const result = yield appointment_model_1.Appointment.aggregate([
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
            stats[status] = item.count;
        }
    });
    return stats;
});
exports.getAppointmentStats = getAppointmentStats;
/**
 * Get withdrawal statistics
 */
const getWithdrawalStats = (startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.getWithdrawalStats = getWithdrawalStats;
/**
 * Get monthly revenue trends for current year
 */
const getMonthlyRevenueTrends = (year) => __awaiter(void 0, void 0, void 0, function* () {
    const currentYear = year || new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    const result = yield payment_model_1.Payment.aggregate([
        {
            $match: {
                status: payment_interface_1.PaymentStatus.PAID,
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
});
exports.getMonthlyRevenueTrends = getMonthlyRevenueTrends;
/**
 * Get new user registration stats for current month
 */
const getNewUserStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const { start, end } = (0, stats_utils_1.getCurrentMonthRange)();
    const result = yield user_model_1.UserModel.aggregate([
        {
            $match: {
                isDeleted: false,
                createdAt: { $gte: start, $lte: end },
                role: { $in: [user_interface_1.ERole.LAWYER, user_interface_1.ERole.CLIENT] },
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
        if (item._id === user_interface_1.ERole.LAWYER) {
            lawyers = item.count;
        }
        else if (item._id === user_interface_1.ERole.CLIENT) {
            clients = item.count;
        }
    });
    return { lawyers, clients };
});
exports.getNewUserStats = getNewUserStats;
/**
 * Get top-rated lawyers
 */
const getTopLawyers = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 10) {
    const result = yield lawyer_model_1.LawyerProfileModel.aggregate([
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
});
exports.getTopLawyers = getTopLawyers;
/**
 * Get recent appointments with pagination
 */
const getRecentAppointments = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = yield Promise.all([
        appointment_model_1.Appointment.find()
            .populate('clientId', 'profileInfo')
            .populate('lawyerId', 'profile_Details')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        appointment_model_1.Appointment.countDocuments(),
    ]);
    // const meta = buildPaginationMeta(total, page, limit);
    return { data };
});
exports.getRecentAppointments = getRecentAppointments;
