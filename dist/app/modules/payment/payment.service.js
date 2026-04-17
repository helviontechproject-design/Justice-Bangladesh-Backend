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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const payment_interface_1 = require("./payment.interface");
const payment_model_1 = require("./payment.model");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const lawyer_model_1 = require("../lawyer/lawyer.model");
const client_model_1 = require("../client/client.model");
const wallet_model_1 = require("../wallet/wallet.model");
const appointment_model_1 = require("../appointment/appointment.model");
const invoice_1 = require("../../utils/invoice");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const sendMail_1 = require("../../utils/sendMail");
const appointment_interface_1 = require("../appointment/appointment.interface");
const availability_model_1 = require("../availability/availability.model");
const notification_model_1 = require("../notification/notification.model");
const sslCommerz_service_1 = require("./sslCommerz/sslCommerz.service");
const notification_helper_1 = require("../notification/notification.helper");
const reCreatePayment = (id, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (!decodedUser.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized user');
    }
    // Find the payment
    const existingPayment = yield payment_model_1.Payment.findById(id);
    if (!existingPayment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Payment not found');
    }
    // Check if payment is already paid
    if (existingPayment.status === payment_interface_1.PaymentStatus.PAID) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Payment already completed');
    }
    // Check if payment is within 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (existingPayment.createdAt < thirtyMinutesAgo) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Payment link expired. This payment was created more than 30 minutes ago.');
    }
    // Get client profile to verify ownership
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (!client) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Client profile not found');
    }
    // Verify client owns this payment
    if (!existingPayment.clientId.equals(client._id)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You can only recreate your own payment links');
    }
    // Get appointment details
    const appointment = yield appointment_model_1.Appointment.findById(existingPayment.appointmentId);
    if (!appointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Appointment not found');
    }
    // Get lawyer details
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findById(existingPayment.lawyerId);
    if (!lawyer) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer not found');
    }
    // Prepare SSL payload
    const userAddress = client.profileInfo.street_address || client.profileInfo.district || 'Bangladesh';
    const userEmail = client.profileInfo.email || 'demo@gmail.com';
    const userPhoneNumber = client.profileInfo.phone;
    const userName = client.profileInfo.fast_name + ' ' + client.profileInfo.last_name;
    const sslPayload = {
        address: userAddress,
        email: userEmail,
        phoneNumber: userPhoneNumber,
        name: userName,
        amount: existingPayment.amount,
        transactionId: existingPayment.transactionId,
    };
    console.log('🔄 Regenerating payment link for:', existingPayment.transactionId);
    // Generate new payment link
    const sslPayment = yield sslCommerz_service_1.SSLService.sslPaymentInit(sslPayload);
    return {
        appointmentId: appointment._id,
        paymentUrl: (sslPayment === null || sslPayment === void 0 ? void 0 : sslPayment.GatewayPageURL) || (sslPayment === null || sslPayment === void 0 ? void 0 : sslPayment.gatewayPageURL) || null,
    };
});
const successPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield appointment_model_1.Appointment.startSession();
    session.startTransaction();
    try {
        // update payment  Status
        const updatedPayment = yield payment_model_1.Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: payment_interface_1.PaymentStatus.PAID,
        }, { new: true, session: session });
        if (!updatedPayment) {
            throw new AppError_1.default(401, 'Payment not found');
        }
        // update Appointment Status 
        const updateAppointment = yield appointment_model_1.Appointment.findByIdAndUpdate(updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment.appointmentId, { status: appointment_interface_1.AppointmentStatus.PENDING, payment_Status: appointment_interface_1.AppointmentPaymentStatus.PAID }, { new: true, session });
        if (!updateAppointment) {
            throw new AppError_1.default(401, 'Appointment not found');
        }
        // update Availability Status
        yield availability_model_1.AvailabilityModel.updateOne({
            lawyerId: updateAppointment.lawyerId,
            'availableDates.date': updateAppointment.appointmentDate,
            'availableDates.schedules.time': updateAppointment.selectedTime,
        }, {
            $set: {
                'availableDates.$[date].schedules.$[schedule].status': 'booked',
            },
        }, {
            arrayFilters: [
                { 'date.date': updateAppointment.appointmentDate },
                { 'schedule.time': updateAppointment.selectedTime },
            ],
            session,
        });
        // update lawyer wallet
        const lawyerWallet = yield wallet_model_1.WalletModel.findOneAndUpdate({ lawyerId: updateAppointment.lawyerId }, {
            $inc: {
                balance: Math.abs(updatedPayment.amount),
                totalEarned: Math.abs(updatedPayment.amount),
            },
            $push: {
                transactions: updatedPayment._id,
            },
            $set: {
                updatedAt: new Date(),
            },
        }, {
            new: true,
            upsert: true,
            session,
        });
        if (!lawyerWallet) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Lawyer wallet not found');
        }
        const payloadforCreateNotification = {
            senderId: updateAppointment === null || updateAppointment === void 0 ? void 0 : updateAppointment.clientId,
            recipientId: updateAppointment.lawyerId,
            title: "New Payment Request",
            body: `You have a new appointment from ${updateAppointment.clientId}`,
            type: "APPOINTMENT",
            isRead: false,
        };
        yield notification_model_1.Notification.create([payloadforCreateNotification], { session });
        const client = yield client_model_1.ClientProfileModel.findById(updateAppointment === null || updateAppointment === void 0 ? void 0 : updateAppointment.clientId);
        const invoiceData = {
            transactionId: updatedPayment.transactionId,
            AppointmentDate: updatedPayment.createdAt,
            clientName: (client === null || client === void 0 ? void 0 : client.profileInfo.fast_name) + ' ' +
                (client === null || client === void 0 ? void 0 : client.profileInfo.last_name),
            clientEmail: client === null || client === void 0 ? void 0 : client.profileInfo.email,
            paymentMethod: 'sslCommerz',
            totalAmount: updatedPayment.amount,
            status: payment_interface_1.PaymentStatus.PAID,
            approvedBy: 'Admin',
        };
        const pdfBuffer = yield (0, invoice_1.generatePdf)(invoiceData);
        const cloudinaryResult = yield (0, cloudinary_config_1.uploadBufferToCloudinary)(pdfBuffer, 'invoice');
        if (!cloudinaryResult) {
            throw new AppError_1.default(401, 'Error uploading pdf');
        }
        yield payment_model_1.Payment.findByIdAndUpdate(updatedPayment._id, { invoiceUrl: cloudinaryResult.secure_url }, { new: true, session });
        // // (vendor?.userId as unknown as TUser).email
        yield (0, sendMail_1.sendEmail)({
            to: 'ibrahimsarkar.dev@gmail.com',
            subject: 'Your Payment Invoice',
            templateName: 'invoice',
            templateData: invoiceData,
            attachments: [
                {
                    filename: 'invoice.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        });
        yield session.commitTransaction();
        session.endSession();
        // Send payment success notifications
        try {
            const populatedAppointment = yield appointment_model_1.Appointment.findById(updateAppointment._id)
                .populate('clientId', 'profileInfo')
                .populate('lawyerId', 'profile_Details');
            if (populatedAppointment) {
                yield notification_helper_1.NotificationHelper.notifyPaymentSuccess(updatedPayment, populatedAppointment);
            }
        }
        catch (error) {
            console.error('Error sending payment notification:', error);
        }
        return { success: true, message: 'Payment Completed Successfully' };
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const failPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield appointment_model_1.Appointment.startSession();
    session.startTransaction();
    try {
        const updatedPayment = yield payment_model_1.Payment.findOneAndUpdate({ transactionId: query.transactionId }, { status: payment_interface_1.PaymentStatus.FAILED }, { new: true, runValidators: true, session });
        if (!updatedPayment) {
            throw new Error('Payment not found');
        }
        yield appointment_model_1.Appointment.findByIdAndUpdate(updatedPayment.appointmentId, { status: appointment_interface_1.AppointmentStatus.REJECTED }, { new: true, runValidators: true, session });
        yield session.commitTransaction();
        yield session.endSession();
        // Send payment failed notification
        try {
            const appointment = yield appointment_model_1.Appointment.findById(updatedPayment.appointmentId)
                .populate('clientId', 'profileInfo')
                .populate('lawyerId', 'profile_Details');
            if (appointment) {
                yield notification_helper_1.NotificationHelper.notifyPaymentFailed(updatedPayment, appointment);
            }
        }
        catch (error) {
            console.error('Error sending payment failed notification:', error);
        }
        return { success: false, message: 'Payment Failed' };
    }
    catch (error) {
        yield session.abortTransaction();
        yield session.endSession();
        throw error;
    }
});
const cancelPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield appointment_model_1.Appointment.startSession();
    session.startTransaction();
    try {
        const updatedPayment = yield payment_model_1.Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: payment_interface_1.PaymentStatus.CANCELLED,
        }, { runValidators: true, session: session });
        yield appointment_model_1.Appointment.findByIdAndUpdate(updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment.appointmentId, { paymentStatus: appointment_interface_1.AppointmentStatus.CANCELLED }, { runValidators: true, session });
        yield session.commitTransaction();
        session.endSession();
        return { success: false, message: 'Payment Cancelled' };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const getAllPayments = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const payments = payment_model_1.Payment.find()
        .populate('lawyerId')
        .populate('clientId')
        .populate('appointmentId');
    const queryBuilder = new QueryBuilder_1.QueryBuilder(payments, query);
    const allPayments = queryBuilder.filter().sort().paginate();
    const [data, meta] = yield Promise.all([
        allPayments.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getMyPayments = (decodedUser, query) => __awaiter(void 0, void 0, void 0, function* () {
    if (!decodedUser.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized user');
    }
    let filterQuery = {};
    // Check if user is lawyer or client
    const lawyer = yield lawyer_model_1.LawyerProfileModel.findOne({ userId: decodedUser.userId });
    const client = yield client_model_1.ClientProfileModel.findOne({ userId: decodedUser.userId });
    if (lawyer) {
        filterQuery = { lawyerId: lawyer._id };
    }
    else if (client) {
        filterQuery = { clientId: client._id };
    }
    else {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Profile not found');
    }
    const payments = payment_model_1.Payment.find(filterQuery)
        .populate('lawyerId')
        .populate('clientId')
        .populate('appointmentId')
        .sort({ createdAt: -1 });
    const queryBuilder = new QueryBuilder_1.QueryBuilder(payments, query);
    const myPayments = queryBuilder.filter().paginate();
    const [data, meta] = yield Promise.all([
        myPayments.build().exec(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getSinglePayment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.Payment.findById(id)
        .populate('lawyerId')
        .populate('clientId')
        .populate('appointmentId');
    if (!payment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Payment not found');
    }
    return payment;
});
const getPaymentByTransactionId = (transactionId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.Payment.findOne({ transactionId })
        .populate('lawyerId')
        .populate('clientId')
        .populate('appointmentId');
    if (!payment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Payment not found');
    }
    return payment;
});
const updatePayment = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.Payment.findById(id);
    if (!payment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Payment not found');
    }
    const updatedPayment = yield payment_model_1.Payment.findByIdAndUpdate(id, payload, {
        new: true,
    })
        .populate('lawyerId')
        .populate('clientId')
        .populate('appointmentId');
    return updatedPayment;
});
const updatePaymentStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.Payment.findById(id);
    if (!payment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Payment not found');
    }
    const oldStatus = payment.status;
    payment.status = status;
    yield payment.save();
    // Update wallet if status changed to PAID
    if (oldStatus !== payment_interface_1.PaymentStatus.PAID && status === payment_interface_1.PaymentStatus.PAID) {
        yield wallet_model_1.WalletModel.findOneAndUpdate({ lawyerId: payment.lawyerId }, {
            $inc: {
                balance: payment.amount,
                totalEarned: payment.amount,
            },
            $push: { transactions: payment._id },
        }, { upsert: true });
    }
    // Handle refund
    if (status === payment_interface_1.PaymentStatus.REFUNDED && oldStatus === payment_interface_1.PaymentStatus.PAID) {
        yield wallet_model_1.WalletModel.findOneAndUpdate({ lawyerId: payment.lawyerId }, {
            $inc: {
                balance: -payment.amount,
                totalEarned: -payment.amount,
            },
        });
        // Send refund notification
        try {
            const appointment = yield appointment_model_1.Appointment.findById(payment.appointmentId)
                .populate('clientId', 'profileInfo')
                .populate('lawyerId', 'profile_Details');
            if (appointment) {
                yield notification_helper_1.NotificationHelper.notifyPaymentRefunded(payment, appointment);
            }
        }
        catch (error) {
            console.error('Error sending refund notification:', error);
        }
    }
    return payment;
});
const deletePayment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.Payment.findById(id);
    if (!payment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Payment not found');
    }
    yield payment_model_1.Payment.findByIdAndDelete(id);
});
const getPaymentStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const stats = yield payment_model_1.Payment.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
            },
        },
    ]);
    const totalPayments = yield payment_model_1.Payment.countDocuments();
    const totalRevenue = yield payment_model_1.Payment.aggregate([
        { $match: { status: payment_interface_1.PaymentStatus.PAID } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return {
        stats,
        totalPayments,
        totalRevenue: ((_a = totalRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
    };
});
exports.paymentService = {
    reCreatePayment,
    successPayment,
    failPayment,
    cancelPayment,
    getAllPayments,
    getMyPayments,
    getSinglePayment,
    getPaymentByTransactionId,
    updatePayment,
    updatePaymentStatus,
    deletePayment,
    getPaymentStats,
};
