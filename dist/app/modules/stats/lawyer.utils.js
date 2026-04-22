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
exports.getLawyerRecentPayments = exports.getLawyerUpcomingAppointments = exports.getLawyerAvailability = exports.getLawyerMonthlyEarnings = exports.getLawyerMonthlyAppointments = exports.getLawyerReviews = exports.getLawyerAppointments = exports.getLawyerBookingRequests = exports.getLawyertodaysSchedule = exports.getLawyertodaysAnalytics = void 0;
const mongoose_1 = require("mongoose");
const stats_utils_1 = require("./stats.utils");
const appointment_model_1 = require("../appointment/appointment.model");
const review_model_1 = require("../review/review.model");
const payment_model_1 = require("../payment/payment.model");
const payment_interface_1 = require("../payment/payment.interface");
const availability_model_1 = require("../availability/availability.model");
const appointment_interface_1 = require("../appointment/appointment.interface");
/**
 * Get lawyer today's analytics (appointments, pending requests, earnings)
 */
const getLawyertodaysAnalytics = (lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [todaysAppointments, pendingAppointments, todaysEarnings] = yield Promise.all([
        appointment_model_1.Appointment.countDocuments({
            lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
            createdAt: { $gte: today, $lt: tomorrow },
        }),
        appointment_model_1.Appointment.countDocuments({
            lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
            status: appointment_interface_1.AppointmentStatus.PENDING,
        }),
        payment_model_1.Payment.aggregate([
            {
                $match: {
                    lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
                    status: payment_interface_1.PaymentStatus.PAID,
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
        earningsToday: ((_a = todaysEarnings[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
    };
});
exports.getLawyertodaysAnalytics = getLawyertodaysAnalytics;
const getLawyertodaysSchedule = (lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysSchedule = yield appointment_model_1.Appointment.find({
        lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
        appointmentDate: { $gte: today },
        status: appointment_interface_1.AppointmentStatus.CONFIRMED,
    })
        .populate({
        path: 'clientId',
        select: 'profileInfo.fast_name profileInfo.last_name profileInfo.photo userId',
        populate: { path: 'userId', select: 'profilePhoto' },
    })
        .sort({ appointmentDate: 1, selectedTime: 1 })
        .lean();
    return todaysSchedule;
});
exports.getLawyertodaysSchedule = getLawyertodaysSchedule;
const getLawyerBookingRequests = (lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    const bookingRequests = yield appointment_model_1.Appointment.find({
        lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
        status: appointment_interface_1.AppointmentStatus.PENDING,
        payment_Status: 'PAID',
    })
        .populate({
        path: 'clientId',
        select: 'profileInfo.fast_name profileInfo.last_name profileInfo.photo userId',
        populate: { path: 'userId', select: 'profilePhoto' },
    })
        .sort({ createdAt: -1 })
        .lean();
    return bookingRequests;
});
exports.getLawyerBookingRequests = getLawyerBookingRequests;
/**
 * Get lawyer appointments by status
 */
const getLawyerAppointments = (lawyerId, startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    const dateFilter = (0, stats_utils_1.buildDateRangeFilter)(startDate, endDate, 'createdAt');
    const result = yield appointment_model_1.Appointment.aggregate([
        {
            $match: Object.assign({ lawyerId: new mongoose_1.Types.ObjectId(lawyerId) }, dateFilter),
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
exports.getLawyerAppointments = getLawyerAppointments;
/**
 * Get lawyer reviews statistics
 */
const getLawyerReviews = (lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield review_model_1.ClientReview.aggregate([
        {
            $match: {
                lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
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
});
exports.getLawyerReviews = getLawyerReviews;
/**
 * Get lawyer monthly appointment trends
 */
const getLawyerMonthlyAppointments = (lawyerId, year) => __awaiter(void 0, void 0, void 0, function* () {
    const currentYear = year || new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    const result = yield appointment_model_1.Appointment.aggregate([
        {
            $match: {
                lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
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
exports.getLawyerMonthlyAppointments = getLawyerMonthlyAppointments;
/**
 * Get lawyer monthly earnings trends
 */
const getLawyerMonthlyEarnings = (lawyerId, year) => __awaiter(void 0, void 0, void 0, function* () {
    const currentYear = year || new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    const result = yield payment_model_1.Payment.aggregate([
        {
            $match: {
                lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
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
});
exports.getLawyerMonthlyEarnings = getLawyerMonthlyEarnings;
/**
 * Get lawyer availability statistics
 */
const getLawyerAvailability = (lawyerId) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const currentMonth = (0, stats_utils_1.formatMonthString)(now.getFullYear(), now.getMonth() + 1);
    const availability = yield availability_model_1.AvailabilityModel.findOne({
        lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
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
});
exports.getLawyerAvailability = getLawyerAvailability;
/**
 * Get lawyer upcoming appointments with pagination
 */
const getLawyerUpcomingAppointments = (lawyerId_1, ...args_1) => __awaiter(void 0, [lawyerId_1, ...args_1], void 0, function* (lawyerId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const today = new Date();
    // today.setHours(0, 0, 0, 0);
    const [data, total] = yield Promise.all([
        appointment_model_1.Appointment.find({
            lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
            // appointmentDate: { $gte: today },
        })
            .populate('clientId', 'profileInfo')
            .sort({ appointmentDate: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        appointment_model_1.Appointment.countDocuments({
            lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
            // appointmentDate: { $gte: today },
        }),
    ]);
    // const meta = buildPaginationMeta(total, page, limit);
    return { data };
});
exports.getLawyerUpcomingAppointments = getLawyerUpcomingAppointments;
/**
 * Get lawyer recent payments with pagination
 */
const getLawyerRecentPayments = (lawyerId_1, ...args_1) => __awaiter(void 0, [lawyerId_1, ...args_1], void 0, function* (lawyerId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = yield Promise.all([
        payment_model_1.Payment.find({ lawyerId: new mongoose_1.Types.ObjectId(lawyerId) })
            .populate('clientId', 'profileInfo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        payment_model_1.Payment.countDocuments({ lawyerId: new mongoose_1.Types.ObjectId(lawyerId) }),
    ]);
    // const meta = buildPaginationMeta(total, page, limit);
    return { data };
});
exports.getLawyerRecentPayments = getLawyerRecentPayments;
