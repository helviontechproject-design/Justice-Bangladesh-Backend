import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { IPayment, PaymentStatus } from './payment.interface';
import { Payment } from './payment.model';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { JwtPayload } from 'jsonwebtoken';
import { LawyerProfileModel } from '../lawyer/lawyer.model';
import { ClientProfileModel } from '../client/client.model';
import { WalletModel } from '../wallet/wallet.model';
import { Appointment } from '../appointment/appointment.model';
import { generatePdf, IInvoiceData } from '../../utils/invoice';
import { uploadBufferToCloudinary } from '../../config/cloudinary.config';
import { sendEmail } from '../../utils/sendMail';
import { AppointmentPaymentStatus, AppointmentStatus } from '../appointment/appointment.interface';
import { AvailabilityModel } from '../availability/availability.model';
import { Notification } from '../notification/notification.model';
import { SSLService } from './sslCommerz/sslCommerz.service';
import { NotificationHelper } from '../notification/notification.helper';

const reCreatePayment = async (id: string, decodedUser: JwtPayload) => {
  if (!decodedUser.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized user');
  }

  // Find the payment
  const existingPayment = await Payment.findById(id);

  if (!existingPayment) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Payment not found');
  }

  // Check if payment is already paid
  if (existingPayment.status === PaymentStatus.PAID) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Payment already completed');
  }

  // Check if payment is within 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  if (existingPayment.createdAt < thirtyMinutesAgo) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Payment link expired. This payment was created more than 30 minutes ago.'
    );
  }

  // Get client profile to verify ownership
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Client profile not found');
  }

  // Verify client owns this payment
  if (!existingPayment.clientId.equals(client._id)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You can only recreate your own payment links'
    );
  }

  // Get appointment details
  const appointment = await Appointment.findById(existingPayment.appointmentId);
  if (!appointment) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Appointment not found');
  }

  // Get lawyer details
  const lawyer = await LawyerProfileModel.findById(existingPayment.lawyerId);
  if (!lawyer) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer not found');
  }

  // Prepare SSL payload
  const userAddress =
    client.profileInfo.street_address || client.profileInfo.district || 'Bangladesh';
  const userEmail = client.profileInfo.email || 'demo@gmail.com';
  const userPhoneNumber = client.profileInfo.phone;
  const userName =
    client.profileInfo.fast_name + ' ' + client.profileInfo.last_name;

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
  const sslPayment = await SSLService.sslPaymentInit(sslPayload);

  return {
    appointmentId: appointment._id,
    paymentUrl: sslPayment?.GatewayPageURL || sslPayment?.gatewayPageURL || null,
  };
};


const successPayment = async (query: Record<string, string>) => {

  const session = await Appointment.startSession();
  session.startTransaction();

  try {

    // update payment  Status
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },
      {
        status: PaymentStatus.PAID,
      },
      { new: true, session: session }
    );

    if (!updatedPayment) {
      throw new AppError(401, 'Payment not found');
    }

    // update Appointment Status 
    const updateAppointment = await Appointment.findByIdAndUpdate(
      updatedPayment?.appointmentId,
      { status: AppointmentStatus.PENDING, payment_Status: AppointmentPaymentStatus.PAID },
      { new: true, session }
    );

    if (!updateAppointment) {
      throw new AppError(401, 'Appointment not found');
    }



    // update Availability Status
    await AvailabilityModel.updateOne(
      {
        lawyerId: updateAppointment.lawyerId,
        'availableDates.date': updateAppointment.appointmentDate,
        'availableDates.schedules.time': updateAppointment.selectedTime,
      },
      {
        $set: {
          'availableDates.$[date].schedules.$[schedule].status': 'booked',
        },
      },
      {
        arrayFilters: [
          { 'date.date': updateAppointment.appointmentDate },
          { 'schedule.time': updateAppointment.selectedTime },
        ],
        session,
      }
    );



    // update lawyer wallet

    const lawyerWallet = await WalletModel.findOneAndUpdate(
      { lawyerId: updateAppointment.lawyerId },
      {
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
      },
      {
        new: true,
        upsert: true,
        session,
      }
    );


    if (!lawyerWallet) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Lawyer wallet not found');
    }



    const payloadforCreateNotification = {
      senderId: updateAppointment?.clientId,
      recipientId: updateAppointment.lawyerId,
      title: "New Payment Request",
      body: `You have a new appointment from ${updateAppointment.clientId}`,
      type: "APPOINTMENT",
      isRead: false,
    };

    await Notification.create([payloadforCreateNotification], { session });



    const client = await ClientProfileModel.findById(
      updateAppointment?.clientId
    );
    const invoiceData: IInvoiceData = {
      transactionId: updatedPayment.transactionId,
      AppointmentDate: updatedPayment.createdAt,
      clientName:
        client?.profileInfo.fast_name + ' ' +
        client?.profileInfo.last_name,
      clientEmail: client?.profileInfo.email as string,
      paymentMethod: 'sslCommerz',
      totalAmount: updatedPayment.amount,
      status: PaymentStatus.PAID,
      approvedBy: 'Admin',
    };

    const pdfBuffer = await generatePdf(invoiceData);

    const cloudinaryResult = await uploadBufferToCloudinary(
      pdfBuffer,
      'invoice'
    );

    if (!cloudinaryResult) {
      throw new AppError(401, 'Error uploading pdf');
    }

    await Payment.findByIdAndUpdate(
      updatedPayment._id,
      { invoiceUrl: cloudinaryResult.secure_url },
      { new: true, session }
    );
    // // (vendor?.userId as unknown as TUser).email
    await sendEmail({
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

    await session.commitTransaction();
    session.endSession();

    // Send payment success notifications
    try {
      const populatedAppointment = await Appointment.findById(updateAppointment._id)
        .populate('clientId', 'profileInfo')
        .populate('lawyerId', 'profile_Details');
      
      if (populatedAppointment) {
        await NotificationHelper.notifyPaymentSuccess(updatedPayment, populatedAppointment);
      }
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }

    return { success: true, message: 'Payment Completed Successfully' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const failPayment = async (query: Record<string, string>) => {
  const session = await Appointment.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },
      { status: PaymentStatus.FAILED },
      { new: true, runValidators: true, session }
    );

    if (!updatedPayment) {
      throw new Error('Payment not found');
    }

    await Appointment.findByIdAndUpdate(
      updatedPayment.appointmentId,
      { status: AppointmentStatus.REJECTED },
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction();
    await session.endSession();

    // Send payment failed notification
    try {
      const appointment = await Appointment.findById(updatedPayment.appointmentId)
        .populate('clientId', 'profileInfo')
        .populate('lawyerId', 'profile_Details');
      
      if (appointment) {
        await NotificationHelper.notifyPaymentFailed(updatedPayment, appointment);
      }
    } catch (error) {
      console.error('Error sending payment failed notification:', error);
    }

    return { success: false, message: 'Payment Failed' };
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};


const cancelPayment = async (query: Record<string, string>) => {
  const session = await Appointment.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },
      {
        status: PaymentStatus.CANCELLED,
      },
      { runValidators: true, session: session }
    );

    await Appointment.findByIdAndUpdate(
      updatedPayment?.appointmentId,
      { paymentStatus: AppointmentStatus.CANCELLED },
      { runValidators: true, session }
    );

    await session.commitTransaction();
    session.endSession();
    return { success: false, message: 'Payment Cancelled' };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getAllPayments = async (query: Record<string, string>) => {
  const payments = Payment.find()
    .populate('lawyerId')
    .populate('clientId')
    .populate('appointmentId');

  const queryBuilder = new QueryBuilder(payments, query);

  const allPayments = queryBuilder.filter().sort().paginate();

  const [data, meta] = await Promise.all([
    allPayments.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getMyPayments = async (
  decodedUser: JwtPayload,
  query: Record<string, string>
) => {
  if (!decodedUser.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized user');
  }

  let filterQuery = {};

  // Check if user is lawyer or client
  const lawyer = await LawyerProfileModel.findOne({ userId: decodedUser.userId });
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });

  if (lawyer) {
    filterQuery = { lawyerId: lawyer._id };
  } else if (client) {
    filterQuery = { clientId: client._id };
  } else {
    throw new AppError(StatusCodes.NOT_FOUND, 'Profile not found');
  }

  const payments = Payment.find(filterQuery)
    .populate('lawyerId')
    .populate('clientId')
    .populate('appointmentId')
    .sort({ createdAt: -1 });

  const queryBuilder = new QueryBuilder(payments, query);

  const myPayments = queryBuilder.filter().paginate();

  const [data, meta] = await Promise.all([
    myPayments.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getSinglePayment = async (id: string) => {
  const payment = await Payment.findById(id)
    .populate('lawyerId')
    .populate('clientId')
    .populate('appointmentId');

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Payment not found');
  }

  return payment;
};

const getPaymentByTransactionId = async (transactionId: string) => {
  const payment = await Payment.findOne({ transactionId })
    .populate('lawyerId')
    .populate('clientId')
    .populate('appointmentId');

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Payment not found');
  }

  return payment;
};

const updatePayment = async (id: string, payload: Partial<IPayment>) => {
  const payment = await Payment.findById(id);

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Payment not found');
  }

  const updatedPayment = await Payment.findByIdAndUpdate(id, payload, {
    new: true,
  })
    .populate('lawyerId')
    .populate('clientId')
    .populate('appointmentId');

  return updatedPayment;
};

const updatePaymentStatus = async (id: string, status: PaymentStatus) => {
  const payment = await Payment.findById(id);

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Payment not found');
  }

  const oldStatus = payment.status;
  payment.status = status;
  await payment.save();

  // Update wallet if status changed to PAID
  if (oldStatus !== PaymentStatus.PAID && status === PaymentStatus.PAID) {
    await WalletModel.findOneAndUpdate(
      { lawyerId: payment.lawyerId },
      {
        $inc: {
          balance: payment.amount,
          totalEarned: payment.amount,
        },
        $push: { transactions: payment._id },
      },
      { upsert: true }
    );
  }

  // Handle refund
  if (status === PaymentStatus.REFUNDED && oldStatus === PaymentStatus.PAID) {
    await WalletModel.findOneAndUpdate(
      { lawyerId: payment.lawyerId },
      {
        $inc: {
          balance: -payment.amount,
          totalEarned: -payment.amount,
        },
      }
    );

    // Send refund notification
    try {
      const appointment = await Appointment.findById(payment.appointmentId)
        .populate('clientId', 'profileInfo')
        .populate('lawyerId', 'profile_Details');
      
      if (appointment) {
        await NotificationHelper.notifyPaymentRefunded(payment, appointment);
      }
    } catch (error) {
      console.error('Error sending refund notification:', error);
    }
  }

  return payment;
};

const deletePayment = async (id: string) => {
  const payment = await Payment.findById(id);

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Payment not found');
  }

  await Payment.findByIdAndDelete(id);
};

const getPaymentStats = async () => {
  const stats = await Payment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  const totalPayments = await Payment.countDocuments();
  const totalRevenue = await Payment.aggregate([
    { $match: { status: PaymentStatus.PAID } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return {
    stats,
    totalPayments,
    totalRevenue: totalRevenue[0]?.total || 0,
  };
};

export const paymentService = {
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
