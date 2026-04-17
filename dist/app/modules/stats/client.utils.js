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
exports.getClientRecentPayments = exports.getClientCompletedAppointments = exports.getClientUpcomingAppointments = exports.getClientMonthlyAppointments = exports.getClientLawyerStats = exports.getClientSpending = exports.getClientAppointments = void 0;
const mongoose_1 = require("mongoose");
const appointment_model_1 = require("../appointment/appointment.model");
const stats_utils_1 = require("./stats.utils");
const payment_model_1 = require("../payment/payment.model");
const payment_interface_1 = require("../payment/payment.interface");
const client_model_1 = require("../client/client.model");
const appointment_interface_1 = require("../appointment/appointment.interface");
/**
 * Get client appointments by status
 */
const getClientAppointments = (clientId, startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    const dateFilter = (0, stats_utils_1.buildDateRangeFilter)(startDate, endDate, 'createdAt');
    const result = yield appointment_model_1.Appointment.aggregate([
        {
            $match: Object.assign({ clientId: new mongoose_1.Types.ObjectId(clientId) }, dateFilter),
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
            stats[status] = item.count;
        }
    });
    return stats;
});
exports.getClientAppointments = getClientAppointments;
/**
 * Get client spending statistics
 */
const getClientSpending = (clientId, startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    const dateFilter = (0, stats_utils_1.buildDateRangeFilter)(startDate, endDate, 'createdAt');
    const result = yield payment_model_1.Payment.aggregate([
        {
            $match: Object.assign({ clientId: new mongoose_1.Types.ObjectId(clientId) }, dateFilter),
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
        if (item._id === payment_interface_1.PaymentStatus.PAID) {
            completedPayments = item.amount;
            totalSpent += item.amount;
        }
        else if (item._id === payment_interface_1.PaymentStatus.UNPAID) {
            pendingPayments = item.amount;
            totalSpent += item.amount;
        }
    });
    return {
        totalSpent,
        pendingPayments,
        completedPayments,
    };
});
exports.getClientSpending = getClientSpending;
/**
 * Get client lawyer statistics
 */
const getClientLawyerStats = (clientId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const uniqueLawyers = yield appointment_model_1.Appointment.distinct('lawyerId', {
        clientId: new mongoose_1.Types.ObjectId(clientId),
    });
    const clientProfile = yield client_model_1.ClientProfileModel.findById(clientId).lean();
    return {
        uniqueLawyersConsulted: uniqueLawyers.length,
        savedLawyers: ((_a = clientProfile === null || clientProfile === void 0 ? void 0 : clientProfile.savedLawyers) === null || _a === void 0 ? void 0 : _a.length) || 0,
    };
});
exports.getClientLawyerStats = getClientLawyerStats;
/**
 * Get client monthly appointment trends
 */
const getClientMonthlyAppointments = (clientId, year) => __awaiter(void 0, void 0, void 0, function* () {
    const currentYear = year || new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    const result = yield appointment_model_1.Appointment.aggregate([
        {
            $match: {
                clientId: new mongoose_1.Types.ObjectId(clientId),
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
});
exports.getClientMonthlyAppointments = getClientMonthlyAppointments;
/**
 * Get client upcoming appointments with pagination
 */
const getClientUpcomingAppointments = (clientId_1, ...args_1) => __awaiter(void 0, [clientId_1, ...args_1], void 0, function* (clientId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [data, total] = yield Promise.all([
        appointment_model_1.Appointment.find({
            clientId: clientId,
            // appointmentDate: { $gte: today },
        })
            .populate('lawyerId', 'profile_Details')
            .sort({ appointmentDate: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        appointment_model_1.Appointment.countDocuments({
            clientId: new mongoose_1.Types.ObjectId(clientId),
            // appointmentDate: { $gte: today },
        }),
    ]);
    // const meta = buildPaginationMeta(total, page, limit);
    return { data };
});
exports.getClientUpcomingAppointments = getClientUpcomingAppointments;
/**
 * Get client completed appointments with pagination
 */
const getClientCompletedAppointments = (clientId_1, ...args_1) => __awaiter(void 0, [clientId_1, ...args_1], void 0, function* (clientId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = yield Promise.all([
        appointment_model_1.Appointment.find({
            clientId: new mongoose_1.Types.ObjectId(clientId),
            status: appointment_interface_1.AppointmentStatus.COMPLETED,
        })
            .populate('lawyerId', 'profile_Details')
            .sort({ appointmentDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        appointment_model_1.Appointment.countDocuments({
            clientId: new mongoose_1.Types.ObjectId(clientId),
            status: appointment_interface_1.AppointmentStatus.COMPLETED,
        }),
    ]);
    // const meta = buildPaginationMeta(total, page, limit);
    return { data };
});
exports.getClientCompletedAppointments = getClientCompletedAppointments;
/**
 * Get client recent payments with pagination
 */
const getClientRecentPayments = (clientId_1, ...args_1) => __awaiter(void 0, [clientId_1, ...args_1], void 0, function* (clientId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = yield Promise.all([
        payment_model_1.Payment.find({ clientId: new mongoose_1.Types.ObjectId(clientId) })
            .populate('lawyerId', 'profile_Details')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        payment_model_1.Payment.countDocuments({ clientId: new mongoose_1.Types.ObjectId(clientId) }),
    ]);
    // const meta = buildPaginationMeta(total, page, limit);
    return { data };
});
exports.getClientRecentPayments = getClientRecentPayments;
