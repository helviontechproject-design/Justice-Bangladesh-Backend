"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const appointment_interface_1 = require("./appointment.interface");
const appointment_model_1 = require("./appointment.model");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const mongoose_1 = __importStar(require("mongoose"));
const client_model_1 = require("../client/client.model");
const lawyer_model_1 = require("../lawyer/lawyer.model");
const availability_model_1 = require("../availability/availability.model");
const payment_model_1 = require("../payment/payment.model");
const payment_interface_1 = require("../payment/payment.interface");
const wallet_model_1 = require("../wallet/wallet.model");
const user_interface_1 = require("../user/user.interface");
const bkash_service_1 = require("../bkash/bkash.service");
const conversation_model_1 = require("../chat/conversation/conversation.model");
const user_model_1 = require("../user/user.model");
const notification_helper_1 = require("../notification/notification.helper");
const createAppointment = (decodedUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!decodedUser.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized user");
    }
    let client = yield client_model_1.ClientProfileModel.findOne({
        userId: new mongoose_1.Types.ObjectId(decodedUser.userId),
    });
    if (!client) {
        // Auto-create client profile if missing (can happen with phone login)
        client = yield client_model_1.ClientProfileModel.create({
            userId: new mongoose_1.Types.ObjectId(decodedUser.userId),
            profileInfo: {},
            gender: 'MALE',
        });
        yield user_model_1.UserModel.findByIdAndUpdate(decodedUser.userId, { client: client._id });
    }
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(payload.lawyerId);
    if (!lawyer) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Lawyer not found");
    }
    // Extract date & time properly
    const appointmentDate = new Date(payload.appointmentDate);
    const selectedTime = payload.selectedTime;
    const now = new Date();
    // Validation: Minimum 2 hours advance booking
    const minBookingTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const appointmentDateTime = new Date(appointmentDate);
    const [hours, minutes] = selectedTime.replace(/[AP]M/, '').split(':').map(Number);
    const isPM = selectedTime.includes('PM');
    appointmentDateTime.setHours(isPM && hours !== 12 ? hours + 12 : (hours === 12 && !isPM ? 0 : hours), minutes);
    if (appointmentDateTime < minBookingTime) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Appointments must be booked at least 2 hours in advance");
    }
    // Validation: Maximum 30 days advance booking
    const maxBookingTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (appointmentDateTime > maxBookingTime) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Appointments cannot be booked more than 30 days in advance");
    }
    // Check for duplicate booking (same client, same lawyer, same day)
    const dupDateStart = new Date(appointmentDate);
    dupDateStart.setUTCHours(0, 0, 0, 0);
    const dupDateEnd = new Date(appointmentDate);
    dupDateEnd.setUTCHours(23, 59, 59, 999);
    const existingAppointment = yield appointment_model_1.Appointment.findOne({
        clientId: client._id,
        lawyerId: payload.lawyerId,
        appointmentDate: { $gte: dupDateStart, $lte: dupDateEnd },
        status: { $in: [appointment_interface_1.AppointmentStatus.PENDING, appointment_interface_1.AppointmentStatus.CONFIRMED] }
    });
    if (existingAppointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You already have a booking with this lawyer on the selected date");
    }
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // Atomic check and book with session lock
        const dateStart = new Date(appointmentDate);
        dateStart.setUTCHours(0, 0, 0, 0);
        const dateEnd = new Date(appointmentDate);
        dateEnd.setUTCHours(23, 59, 59, 999);
        const isBooked = yield availability_model_1.AvailabilityModel.findOne({
            lawyerId: payload.lawyerId,
            availableDates: {
                $elemMatch: {
                    date: { $gte: dateStart, $lte: dateEnd },
                    schedules: {
                        $elemMatch: {
                            time: selectedTime,
                            $or: [
                                { isBooked: true },
                                { status: 'pending' },
                                { status: 'booked' }
                            ]
                        },
                    },
                },
            },
        }).session(session);
        if (isBooked) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "This time slot is no longer available");
        }
        const availableThis = yield availability_model_1.AvailabilityModel.findOne({
            lawyerId: payload.lawyerId,
            availableDates: {
                $elemMatch: {
                    date: { $gte: dateStart, $lte: dateEnd },
                    schedules: {
                        $elemMatch: {
                            time: selectedTime,
                            isBooked: { $ne: true },
                            status: { $nin: ['pending', 'booked'] }
                        },
                    },
                },
            },
        }).session(session);
        if (!availableThis) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "This time slot is not available");
        }
        // Mark slot as pending
        yield availability_model_1.AvailabilityModel.updateOne({
            lawyerId: payload.lawyerId,
            "availableDates.date": { $gte: dateStart, $lte: dateEnd },
            "availableDates.schedules.time": selectedTime,
        }, {
            $set: {
                "availableDates.$[date].schedules.$[schedules].isBooked": true,
                "availableDates.$[date].schedules.$[schedules].status": "pending",
                "availableDates.$[date].schedules.$[schedules].bookedBy": decodedUser.userId,
            },
        }, {
            arrayFilters: [
                { "date.date": { $gte: dateStart, $lte: dateEnd } },
                { "schedules.time": selectedTime },
            ],
            session,
        });
        const videoCallingId = `VC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const payment = yield payment_model_1.Payment.create([
            {
                lawyerId: payload.lawyerId,
                clientId: client._id,
                appointmentId: null,
                transactionId,
                amount: payload.totalFee || lawyer.per_consultation_fee || 0,
                type: payment_interface_1.PaymentType.BOOKING_FEE,
                status: payment_interface_1.PaymentStatus.UNPAID,
                description: `Appointment booking for ${payload.caseType} with ${((_a = lawyer.profile_Details) === null || _a === void 0 ? void 0 : _a.fast_name) || ""} ${((_b = lawyer.profile_Details) === null || _b === void 0 ? void 0 : _b.last_name) || ""}`,
            },
        ], { session });
        const paymentId = payment[0]._id;
        const appointment = yield appointment_model_1.Appointment.create([
            {
                clientId: client._id,
                lawyerId: payload.lawyerId,
                paymentId,
                videoCallingId,
                videoCallingTime: payload.videoCallingTime || 30,
                appointmentDate: payload.appointmentDate,
                selectedTime: payload.selectedTime,
                appointmentType: payload.appointmentType,
                caseType: payload.caseType,
                note: payload.note,
                documents: payload.documents || [],
                status: appointment_interface_1.AppointmentStatus.PENDING,
                payment_Status: appointment_interface_1.AppointmentPaymentStatus.UNPAID,
            },
        ], { session });
        const appointmentId = appointment[0]._id;
        yield payment_model_1.Payment.findByIdAndUpdate(paymentId, { appointmentId }, { session });
        // update lawyer profile to plus appointments_Count
        const lawyerProfile = yield lawyer_model_1.LawyerProfileModel.findByIdAndUpdate(payload.lawyerId, {
            $inc: { appointments_Count: 1 },
        }, { session });
        // bKash payment init
        const orderId = `APT-${transactionId}`;
        let bkashURL = null;
        let bkashPaymentID = null;
        try {
            const bkashRes = yield bkash_service_1.BkashService.createPayment({
                amount: String(payment[0].amount),
                orderId,
                merchantInvoiceNumber: orderId,
            });
            if ((bkashRes === null || bkashRes === void 0 ? void 0 : bkashRes.statusCode) === '0000') {
                bkashURL = bkashRes.bkashURL;
                bkashPaymentID = bkashRes.paymentID;
                // Store bkashPaymentID in payment record
                yield payment_model_1.Payment.findByIdAndUpdate(paymentId, { bkashPaymentID }, { session });
            }
        }
        catch (error) {
            console.log('bKash API not available, using development mode');
            // Development mode: Create mock payment data
            bkashURL = `https://sandbox.bka.sh/payment?paymentID=DEV-${Date.now()}`;
            bkashPaymentID = `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            yield payment_model_1.Payment.findByIdAndUpdate(paymentId, { bkashPaymentID }, { session });
        }
        yield session.commitTransaction();
        session.endSession();
        // Notify lawyer about new appointment request
        try {
            const populatedAppointment = yield appointment_model_1.Appointment.findById(appointmentId)
                .populate("clientId", "profileInfo")
                .populate("lawyerId", "profile_Details");
            if (populatedAppointment) {
                yield notification_helper_1.NotificationHelper.notifyAppointmentCreated(populatedAppointment);
            }
        }
        catch (error) {
            console.error("Error sending appointment notification:", error);
        }
        return {
            appointmentId,
            bkashURL,
            bkashPaymentID,
            transactionId: payment[0].transactionId,
        };
    }
    catch (error) {
        if (session.inTransaction()) {
            yield session.abortTransaction();
        }
        session.endSession();
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create appointment: ${error}`);
    }
});
const getAllAppointments = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const appointments = appointment_model_1.Appointment.find()
        .populate("clientId", "_id profileInfo")
        .populate("lawyerId", "_id profile_Details")
        .populate("paymentId", "_id amount type status description createdAt updatedAt");
    const queryBuilder = new QueryBuilder_1.QueryBuilder(appointments, query);
    const allAppointments = queryBuilder.filter().sort().paginate();
    const [data, meta] = yield Promise.all([
        allAppointments.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getMyAppointments = (decodedUser, query) => __awaiter(void 0, void 0, void 0, function* () {
    if (!decodedUser.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized user");
    }
    let filterQuery = {};
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({
        userId: decodedUser.userId,
    });
    let client = yield client_model_1.ClientProfileModel.findOne({
        userId: decodedUser.userId,
    });
    if (lawyer) {
        filterQuery = { lawyerId: lawyer._id };
    }
    else if (client) {
        filterQuery = { clientId: client._id };
    }
    else {
        // Auto-create client profile if missing
        client = yield client_model_1.ClientProfileModel.create({
            userId: new mongoose_1.Types.ObjectId(decodedUser.userId),
            profileInfo: {},
            gender: 'MALE',
        });
        yield user_model_1.UserModel.findByIdAndUpdate(decodedUser.userId, { client: client._id });
        filterQuery = { clientId: client._id };
    }
    const appointments = appointment_model_1.Appointment.find(filterQuery)
        .populate({
        path: 'lawyerId',
        select: '_id profile_Details userId',
        populate: {
            path: 'userId',
            select: 'profilePhoto',
        },
    })
        .populate('clientId', '_id profileInfo')
        .populate('paymentId', '_id amount type status description createdAt updatedAt')
        .sort({ createdAt: -1 });
    const queryBuilder = new QueryBuilder_1.QueryBuilder(appointments, query);
    const myAppointments = queryBuilder.filter().paginate();
    const [data, meta] = yield Promise.all([
        myAppointments.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getSingleAppointment = (id, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    const appointment = yield appointment_model_1.Appointment.findById(id)
        .populate("clientId", "_id profileInfo")
        .populate("lawyerId", "_id profile_Details")
        .populate("paymentId", "_id amount type status description createdAt updatedAt");
    if (!appointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Appointment not found");
    }
    // Check authorization
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({
        userId: decodedUser.userId,
    });
    const client = yield client_model_1.ClientProfileModel.findOne({
        userId: decodedUser.userId,
    });
    const isAuthorized = (lawyer && appointment.lawyerId._id.equals(lawyer._id)) ||
        (client && appointment.clientId._id.equals(client._id));
    if (!isAuthorized && decodedUser.role !== user_interface_1.ERole.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not authorized to view this appointment");
    }
    return appointment;
});
const updateAppointment = (id, decodedUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const appointment = yield appointment_model_1.Appointment.findById(id);
    if (!appointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Appointment not found");
    }
    // Only client can update their own appointment
    const client = yield client_model_1.ClientProfileModel.findOne({
        userId: decodedUser.userId,
    });
    if (!client || !appointment.clientId.equals(client._id)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You can only update your own appointments");
    }
    // Cannot update if already confirmed or completed
    if ([appointment_interface_1.AppointmentStatus.CONFIRMED, appointment_interface_1.AppointmentStatus.COMPLETED].includes(appointment.status)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Cannot update confirmed or completed appointments");
    }
    const updatedAppointment = yield appointment_model_1.Appointment.findByIdAndUpdate(id, payload, {
        new: true,
    })
        .populate("clientId", "_id profileInfo")
        .populate("lawyerId", "_id profile_Details")
        .populate("paymentId", "_id amount type status description createdAt updatedAt");
    return updatedAppointment;
});
const updateAppointmentStatus = (id, decodedUser, status, req) => __awaiter(void 0, void 0, void 0, function* () {
    const appointment = yield appointment_model_1.Appointment.findById(id);
    if (!appointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Appointment not found");
    }
    // Lawyer can confirm/reject, client can cancel
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({
        userId: decodedUser.userId,
    });
    const client = yield client_model_1.ClientProfileModel.findOne({
        userId: decodedUser.userId,
    });
    if (lawyer && appointment.lawyerId.equals(lawyer._id)) {
        // Lawyer can confirm, reject, or complete
        if (![
            appointment_interface_1.AppointmentStatus.CONFIRMED,
            appointment_interface_1.AppointmentStatus.REJECTED,
            appointment_interface_1.AppointmentStatus.COMPLETED,
        ].includes(status)) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Lawyer can only confirm, reject, or complete appointments");
        }
    }
    else if (client && appointment.clientId.equals(client._id)) {
        // Client can only cancel if appointment is still pending
        if (appointment.status !== appointment_interface_1.AppointmentStatus.PENDING) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Cannot cancel a confirmed or completed appointment");
        }
        if (status !== appointment_interface_1.AppointmentStatus.CANCELLED) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Client can only cancel appointments");
        }
    }
    else {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Unauthorized to update this appointment");
    }
    appointment.status = status;
    yield appointment.save();
    // Populate appointment for notifications
    const populatedAppointment = yield appointment_model_1.Appointment.findById(id)
        .populate("clientId", "profileInfo")
        .populate("lawyerId", "profile_Details");
    // Send notifications based on status
    try {
        if (status === appointment_interface_1.AppointmentStatus.CONFIRMED && populatedAppointment) {
            yield notification_helper_1.NotificationHelper.notifyAppointmentConfirmed(populatedAppointment);
        }
        else if (status === appointment_interface_1.AppointmentStatus.REJECTED && populatedAppointment) {
            yield notification_helper_1.NotificationHelper.notifyAppointmentDeclined(populatedAppointment);
        }
        else if (status === appointment_interface_1.AppointmentStatus.CANCELLED && populatedAppointment) {
            yield notification_helper_1.NotificationHelper.notifyAppointmentCancelled(populatedAppointment, decodedUser.userId);
        }
        else if (status === appointment_interface_1.AppointmentStatus.COMPLETED && populatedAppointment) {
            yield notification_helper_1.NotificationHelper.notifyAppointmentCompleted(populatedAppointment);
        }
    }
    catch (error) {
        console.error("Error sending appointment status notification:", error);
    }
    // Create Conversation when appointment is confirmed
    if (status === appointment_interface_1.AppointmentStatus.CONFIRMED) {
        try {
            const conversation = yield conversation_model_1.ConversationModel.findOne({
                appointmentId: id,
            });
            const lawyerUser = yield user_model_1.UserModel.findOne({
                role: "LAWYER",
                lawyer: appointment.lawyerId,
            });
            const clientUser = yield user_model_1.UserModel.findOne({
                role: "CLIENT",
                client: appointment.clientId,
            });
            if (!lawyerUser && !clientUser) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "lawyer and client user not found");
            }
            if (!conversation) {
                const Conversation = yield conversation_model_1.ConversationModel.create({
                    appointmentId: id,
                    lawyerUserId: lawyerUser === null || lawyerUser === void 0 ? void 0 : lawyerUser._id.toString(),
                    clientUserId: clientUser === null || clientUser === void 0 ? void 0 : clientUser._id.toString(),
                    isActive: true,
                });
                // Emit Socket.io event to both lawyer and client
                if (req.io) {
                    const lawyerProfile = yield lawyer_model_1.LawyerProfileModel.findById(appointment.lawyerId);
                    const clientProfile = yield client_model_1.ClientProfileModel.findById(appointment.clientId);
                    if (lawyerProfile && clientProfile) {
                        req.io.to(`${lawyerProfile.userId}`).emit("conversation_created", {
                            conversationId: Conversation._id,
                            appointmentId: id,
                            message: "Conversation created for your appointment",
                        });
                        req.io.to(`${clientProfile.userId}`).emit("conversation_created", {
                            conversationId: Conversation._id,
                            appointmentId: id,
                            message: "Conversation created for your appointment",
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error("Error creating Conversation:", error);
            // Don't fail the appointment status update if Conversation creation fails
        }
    }
    // Deactivate Conversation when appointment is cancelled or rejected
    if (status === appointment_interface_1.AppointmentStatus.CANCELLED ||
        status === appointment_interface_1.AppointmentStatus.REJECTED) {
        try {
            const existingConversation = yield conversation_model_1.ConversationModel.findById(id);
            if (!existingConversation) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Conversation not found");
            }
            existingConversation.isActive = false;
            yield existingConversation.save();
        }
        catch (error) {
            console.error("Error deactivating Conversation:", error);
        }
    }
    return yield appointment_model_1.Appointment.findById(id)
        .populate("clientId", "_id profileInfo")
        .populate("lawyerId", "_id profile_Details")
        .populate("paymentId", "_id amount type status description createdAt updatedAt");
});
const updatePaymentStatus = (id, paymentStatus) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const appointment = yield appointment_model_1.Appointment.findById(id);
    if (!appointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Appointment not found");
    }
    appointment.payment_Status = paymentStatus;
    yield appointment.save();
    // Update related payment record
    if (paymentStatus === appointment_interface_1.AppointmentPaymentStatus.PAID) {
        yield payment_model_1.Payment.findByIdAndUpdate(appointment.paymentId, {
            status: payment_interface_1.PaymentStatus.PAID,
        });
        // Update wallet with platform fee deduction
        const payment = yield payment_model_1.Payment.findById(appointment.paymentId);
        if (payment) {
            const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(appointment.lawyerId);
            const platformFeePercent = (_a = lawyer === null || lawyer === void 0 ? void 0 : lawyer.platform_fee_percentage) !== null && _a !== void 0 ? _a : 10; // default 10%
            const platformFee = Math.round((payment.amount * platformFeePercent) / 100);
            const lawyerEarning = payment.amount - platformFee;
            yield wallet_model_1.WalletModel.findOneAndUpdate({ lawyerId: appointment.lawyerId }, {
                $inc: {
                    balance: lawyerEarning,
                    totalEarned: lawyerEarning,
                    totalPlatformFee: platformFee,
                },
                $push: { transactions: payment._id },
            }, { upsert: true });
        }
    }
    return yield appointment_model_1.Appointment.findById(id)
        .populate("clientId", "_id profileInfo")
        .populate("lawyerId", "_id profile_Details")
        .populate("paymentId", "_id amount type status description createdAt updatedAt");
});
const rescheduleAppointment = (id, decodedUser, newDate, newTime) => __awaiter(void 0, void 0, void 0, function* () {
    const appointment = yield appointment_model_1.Appointment.findById(id);
    if (!appointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Appointment not found");
    }
    // Only client can reschedule their confirmed appointments
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client || !appointment.clientId.equals(client._id)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You can only reschedule your own appointments");
    }
    if (appointment.status !== appointment_interface_1.AppointmentStatus.CONFIRMED) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Only confirmed appointments can be rescheduled");
    }
    // Check if reschedule is allowed (at least 4 hours before appointment)
    const appointmentDateTime = new Date(appointment.appointmentDate);
    const [hours, minutes] = appointment.selectedTime.replace(/[AP]M/, '').split(':').map(Number);
    const isPM = appointment.selectedTime.includes('PM');
    appointmentDateTime.setHours(isPM && hours !== 12 ? hours + 12 : (hours === 12 && !isPM ? 0 : hours), minutes);
    const now = new Date();
    const timeDiff = appointmentDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    if (hoursDiff < 4) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Appointments can only be rescheduled at least 4 hours in advance");
    }
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const newAppointmentDate = new Date(newDate);
        // Check if new slot is available
        const isNewSlotBooked = yield availability_model_1.AvailabilityModel.findOne({
            lawyerId: appointment.lawyerId,
            availableDates: {
                $elemMatch: {
                    date: newAppointmentDate,
                    schedules: {
                        $elemMatch: {
                            time: newTime,
                            $or: [{ isBooked: true }, { status: 'pending' }, { status: 'booked' }]
                        },
                    },
                },
            },
        }).session(session);
        if (isNewSlotBooked) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "The new time slot is not available");
        }
        // Release old slot
        yield availability_model_1.AvailabilityModel.updateOne({
            lawyerId: appointment.lawyerId,
            "availableDates.date": appointmentDateTime,
            "availableDates.schedules.time": appointment.selectedTime,
        }, {
            $set: {
                "availableDates.$[date].schedules.$[schedules].isBooked": false,
                "availableDates.$[date].schedules.$[schedules].status": "available",
                "availableDates.$[date].schedules.$[schedules].bookedBy": null,
            },
        }, {
            arrayFilters: [
                { "date.date": appointmentDateTime },
                { "schedules.time": appointment.selectedTime },
            ],
            session,
        });
        // Book new slot
        yield availability_model_1.AvailabilityModel.updateOne({
            lawyerId: appointment.lawyerId,
            "availableDates.date": newAppointmentDate,
            "availableDates.schedules.time": newTime,
        }, {
            $set: {
                "availableDates.$[date].schedules.$[schedules].isBooked": true,
                "availableDates.$[date].schedules.$[schedules].status": "booked",
                "availableDates.$[date].schedules.$[schedules].bookedBy": decodedUser.userId,
            },
        }, {
            arrayFilters: [
                { "date.date": newAppointmentDate },
                { "schedules.time": newTime },
            ],
            session,
        });
        // Update appointment
        appointment.appointmentDate = newAppointmentDate;
        appointment.selectedTime = newTime;
        yield appointment.save({ session });
        yield session.commitTransaction();
        session.endSession();
        // Send notifications
        const populatedAppointment = yield appointment_model_1.Appointment.findById(id)
            .populate("clientId", "profileInfo")
            .populate("lawyerId", "profile_Details");
        if (populatedAppointment) {
            yield notification_helper_1.NotificationHelper.notifyAppointmentRescheduled(populatedAppointment);
        }
        return populatedAppointment;
    }
    catch (error) {
        if (session.inTransaction()) {
            yield session.abortTransaction();
        }
        session.endSession();
        throw error;
    }
});
const cancelAppointmentWithRefund = (id, decodedUser, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const appointment = yield appointment_model_1.Appointment.findById(id).populate('paymentId');
    if (!appointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Appointment not found");
    }
    // Check authorization
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({ userId: decodedUser.userId });
    const isClient = client && appointment.clientId.equals(client._id);
    const isLawyer = lawyer && appointment.lawyerId.equals(lawyer._id);
    if (!isClient && !isLawyer) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Unauthorized to cancel this appointment");
    }
    if (![appointment_interface_1.AppointmentStatus.PENDING, appointment_interface_1.AppointmentStatus.CONFIRMED].includes(appointment.status)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Cannot cancel completed or already cancelled appointments");
    }
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // Calculate refund based on cancellation policy
        let refundPercentage = 0;
        const appointmentDateTime = new Date(appointment.appointmentDate);
        const [hours, minutes] = appointment.selectedTime.replace(/[AP]M/, '').split(':').map(Number);
        const isPM = appointment.selectedTime.includes('PM');
        appointmentDateTime.setHours(isPM && hours !== 12 ? hours + 12 : (hours === 12 && !isPM ? 0 : hours), minutes);
        const now = new Date();
        const timeDiff = appointmentDateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        if (isClient) {
            // Client cancellation policy
            if (hoursDiff >= 24)
                refundPercentage = 90; // 90% refund if cancelled 24+ hours before
            else if (hoursDiff >= 4)
                refundPercentage = 50; // 50% refund if cancelled 4-24 hours before
            else
                refundPercentage = 0; // No refund if cancelled less than 4 hours before
        }
        else if (isLawyer) {
            // Lawyer cancellation - full refund to client
            refundPercentage = 100;
        }
        // Update appointment status
        appointment.status = appointment_interface_1.AppointmentStatus.CANCELLED;
        appointment.cancellationReason = reason;
        appointment.cancelledBy = decodedUser.userId;
        appointment.cancelledAt = new Date();
        yield appointment.save({ session });
        // Release time slot
        const appointmentDate = new Date(appointment.appointmentDate);
        yield availability_model_1.AvailabilityModel.updateOne({
            lawyerId: appointment.lawyerId,
            "availableDates.date": appointmentDate,
            "availableDates.schedules.time": appointment.selectedTime,
        }, {
            $set: {
                "availableDates.$[date].schedules.$[schedules].isBooked": false,
                "availableDates.$[date].schedules.$[schedules].status": "available",
                "availableDates.$[date].schedules.$[schedules].bookedBy": null,
            },
        }, {
            arrayFilters: [
                { "date.date": appointmentDate },
                { "schedules.time": appointment.selectedTime },
            ],
            session,
        });
        // Process refund if applicable
        let refundAmount = 0;
        if (refundPercentage > 0 && appointment.payment_Status === 'PAID') {
            const payment = appointment.paymentId;
            refundAmount = Math.round((payment.amount * refundPercentage) / 100);
            // Create refund record
            yield payment_model_1.Payment.create([
                {
                    lawyerId: appointment.lawyerId,
                    clientId: appointment.clientId,
                    appointmentId: appointment._id,
                    transactionId: `REFUND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    amount: refundAmount,
                    type: payment_interface_1.PaymentType.REFUND,
                    status: payment_interface_1.PaymentStatus.REFUNDED,
                    description: `Refund for cancelled appointment (${refundPercentage}% of ৳${payment.amount})`,
                },
            ], { session });
            // Update lawyer wallet (deduct refund amount)
            yield wallet_model_1.WalletModel.findOneAndUpdate({ lawyerId: appointment.lawyerId }, { $inc: { balance: -refundAmount } }, { session });
        }
        yield session.commitTransaction();
        session.endSession();
        // Send notifications
        const populatedAppointment = yield appointment_model_1.Appointment.findById(id)
            .populate("clientId", "profileInfo")
            .populate("lawyerId", "profile_Details");
        if (populatedAppointment) {
            yield notification_helper_1.NotificationHelper.notifyAppointmentCancelled(populatedAppointment, decodedUser.userId, refundAmount);
        }
        return {
            appointment: populatedAppointment,
            refundAmount,
            refundPercentage,
            message: refundAmount > 0
                ? `Appointment cancelled. ৳${refundAmount} refund will be processed to your wallet.`
                : 'Appointment cancelled.'
        };
    }
    catch (error) {
        if (session.inTransaction()) {
            yield session.abortTransaction();
        }
        session.endSession();
        throw error;
    }
});
const getAppointmentStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield appointment_model_1.Appointment.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);
    const totalAppointments = yield appointment_model_1.Appointment.countDocuments();
    const upcomingAppointments = yield appointment_model_1.Appointment.countDocuments({
        appointmentDateTime: { $gte: new Date() },
        status: { $in: [appointment_interface_1.AppointmentStatus.PENDING, appointment_interface_1.AppointmentStatus.CONFIRMED] },
    });
    return {
        stats,
        totalAppointments,
        upcomingAppointments,
    };
});
const cancelUnpaidAppointments = () => __awaiter(void 0, void 0, void 0, function* () {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    // const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    let session;
    try {
        session = yield mongoose_1.default.startSession();
        session.startTransaction();
    }
    catch (error) {
        session = null;
    }
    try {
        // Find all unpaid appointments older than 30 minutes
        const unpaidAppointments = yield appointment_model_1.Appointment.find({
            payment_Status: appointment_interface_1.AppointmentPaymentStatus.UNPAID,
            createdAt: { $lte: thirtyMinutesAgo },
        }).session(session);
        if (unpaidAppointments.length === 0) {
            if (session) {
                yield session.commitTransaction();
                session.endSession();
            }
            return {
                success: true,
                cancelledCount: 0,
                message: "No unpaid appointments to cancel",
            };
        }
        let cancelledCount = 0;
        const errors = [];
        for (const appointment of unpaidAppointments) {
            try {
                // 1. Delete related payment
                const deletedPayment = yield payment_model_1.Payment.findByIdAndDelete(appointment.paymentId, session ? { session } : {});
                if (deletedPayment) {
                    // 2. Update wallet - no need to update since payment was never confirmed
                    // Wallet is only updated when payment status becomes PAID
                }
                // 3. Update availability - mark slot as available
                const appointmentDate = new Date(appointment.appointmentDate);
                const selectedTime = appointment.selectedTime;
                yield availability_model_1.AvailabilityModel.updateOne({
                    lawyerId: appointment.lawyerId,
                    "availableDates.date": appointmentDate,
                    "availableDates.schedules.time": selectedTime,
                }, {
                    $set: {
                        "availableDates.$[date].schedules.$[schedules].isBooked": false,
                        "availableDates.$[date].schedules.$[schedules].status": "available",
                        "availableDates.$[date].schedules.$[schedules].bookedBy": null,
                    },
                }, Object.assign({ arrayFilters: [
                        { "date.date": appointmentDate },
                        { "schedules.time": selectedTime },
                    ] }, (session ? { session } : {})));
                // 4. Delete appointment
                yield appointment_model_1.Appointment.findByIdAndDelete(appointment._id, session ? { session } : {});
                console.log(`✅ Deleted appointment: ${appointment._id}`);
                cancelledCount++;
            }
            catch (error) {
                const errorMsg = `Failed to cancel appointment ${appointment._id}: ${error}`;
                console.error(`❌ ${errorMsg}`);
                errors.push(errorMsg);
            }
        }
        // Commit transaction
        if (session) {
            yield session.commitTransaction();
            session.endSession();
        }
        return {
            success: true,
            cancelledCount,
            totalFound: unpaidAppointments.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully cancelled ${cancelledCount} unpaid appointments`,
        };
    }
    catch (error) {
        if (session && session.inTransaction()) {
            yield session.abortTransaction();
            session.endSession();
            console.error("🔄 Transaction rolled back due to error");
        }
        console.error("❌ Error in cancelUnpaidAppointments:", error);
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to cancel unpaid appointments: ${error}`);
    }
});
exports.appointmentService = {
    createAppointment,
    getAllAppointments,
    getMyAppointments,
    getSingleAppointment,
    updateAppointment,
    updateAppointmentStatus,
    updatePaymentStatus,
    rescheduleAppointment,
    cancelAppointmentWithRefund,
    getAppointmentStats,
    cancelUnpaidAppointments,
};
