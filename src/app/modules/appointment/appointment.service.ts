import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import {
  AppointmentPaymentStatus,
  AppointmentStatus,
  IAppointment,
} from "./appointment.interface";
import { Appointment } from "./appointment.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { JwtPayload } from "jsonwebtoken";
import mongoose, { Types } from "mongoose";
import { ClientProfileModel } from "../client/client.model";
import { LawyerProfileModel } from "../lawyer/lawyer.model";
import { AvailabilityModel } from "../availability/availability.model";
import { Payment } from "../payment/payment.model";
import { PaymentStatus, PaymentType } from "../payment/payment.interface";
import { WalletModel } from "../wallet/wallet.model";
import { ERole } from "../user/user.interface";
import { BkashService } from "../bkash/bkash.service";
import { ConversationModel } from "../chat/conversation/conversation.model";
import { UserModel } from "../user/user.model";
import { Request } from "express";
import { NotificationHelper } from "../notification/notification.helper";

const createAppointment = async (
  decodedUser: JwtPayload,
  payload: Partial<IAppointment>,
) => {
  if (!decodedUser.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized user");
  }

  let client = await ClientProfileModel.findOne({
    userId: new Types.ObjectId(decodedUser.userId),
  });
  if (!client) {
    // Auto-create client profile if missing (can happen with phone login)
    client = await ClientProfileModel.create({
      userId: new Types.ObjectId(decodedUser.userId),
      profileInfo: {},
      gender: 'MALE',
    });
    await UserModel.findByIdAndUpdate(decodedUser.userId, { client: client._id });
  }

  const lawyer = await LawyerProfileModel.findById(payload.lawyerId);
  if (!lawyer) {
    throw new AppError(StatusCodes.NOT_FOUND, "Lawyer not found");
  }

  // Extract date & time properly
  const appointmentDate = new Date(payload.appointmentDate!);
  const selectedTime = payload.selectedTime;
  const now = new Date();
  
  // Validation: Minimum 2 hours advance booking
  const minBookingTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const appointmentDateTime = new Date(appointmentDate);
  const [hours, minutes] = selectedTime!.replace(/[AP]M/, '').split(':').map(Number);
  const isPM = selectedTime!.includes('PM');
  appointmentDateTime.setHours(isPM && hours !== 12 ? hours + 12 : (hours === 12 && !isPM ? 0 : hours), minutes);
  
  if (appointmentDateTime < minBookingTime) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Appointments must be booked at least 2 hours in advance",
    );
  }
  
  // Validation: Maximum 30 days advance booking
  const maxBookingTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (appointmentDateTime > maxBookingTime) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Appointments cannot be booked more than 30 days in advance",
    );
  }
  
  // Check for duplicate booking (same client, same lawyer, same day)
  const dupDateStart = new Date(appointmentDate);
  dupDateStart.setUTCHours(0, 0, 0, 0);
  const dupDateEnd = new Date(appointmentDate);
  dupDateEnd.setUTCHours(23, 59, 59, 999);

  const existingAppointment = await Appointment.findOne({
    clientId: client._id,
    lawyerId: payload.lawyerId,
    appointmentDate: { $gte: dupDateStart, $lte: dupDateEnd },
    status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }
  });
  
  if (existingAppointment) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You already have a booking with this lawyer on the selected date",
    );
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Atomic check and book with session lock
    const dateStart = new Date(appointmentDate);
    dateStart.setUTCHours(0, 0, 0, 0);
    const dateEnd = new Date(appointmentDate);
    dateEnd.setUTCHours(23, 59, 59, 999);

    const isBooked = await AvailabilityModel.findOne({
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
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "This time slot is no longer available",
      );
    }

    const availableThis = await AvailabilityModel.findOne({
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
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "This time slot is not available",
      );
    }

    // Mark slot as pending
    await AvailabilityModel.updateOne(
      {
        lawyerId: payload.lawyerId,
        "availableDates.date": { $gte: dateStart, $lte: dateEnd },
        "availableDates.schedules.time": selectedTime,
      },
      {
        $set: {
          "availableDates.$[date].schedules.$[schedules].isBooked": true,
          "availableDates.$[date].schedules.$[schedules].status": "pending",
          "availableDates.$[date].schedules.$[schedules].bookedBy": decodedUser.userId,
        },
      },
      {
        arrayFilters: [
          { "date.date": { $gte: dateStart, $lte: dateEnd } },
          { "schedules.time": selectedTime },
        ],
        session,
      },
    );

    const videoCallingId = `VC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const payment = await Payment.create(
      [
        {
          lawyerId: payload.lawyerId,
          clientId: client._id,
          appointmentId: null,
          transactionId,
          amount: payload.totalFee || lawyer.per_consultation_fee || 0,
          type: PaymentType.BOOKING_FEE,
          status: PaymentStatus.UNPAID,
          description: `Appointment booking for ${payload.caseType} with ${lawyer.profile_Details?.fast_name || ""} ${lawyer.profile_Details?.last_name || ""}`,
        },
      ],
      { session },
    );

    const paymentId = payment[0]._id;

    const appointment = await Appointment.create(
      [
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
          status: AppointmentStatus.PENDING,
          payment_Status: AppointmentPaymentStatus.UNPAID,
        },
      ],
      { session },
    );

    const appointmentId = appointment[0]._id;

    await Payment.findByIdAndUpdate(paymentId, { appointmentId }, { session });

    // update lawyer profile to plus appointments_Count
    const lawyerProfile = await LawyerProfileModel.findByIdAndUpdate(
      payload.lawyerId,
      {
        $inc: { appointments_Count: 1 },
      },
      { session },
    );

    // bKash payment init
    const orderId = `APT-${transactionId}`;
    let bkashURL: string | null = null;
    let bkashPaymentID: string | null = null;

    try {
      const bkashRes = await BkashService.createPayment({
        amount: String(payment[0].amount),
        orderId,
        merchantInvoiceNumber: orderId,
      }) as any;

      if (bkashRes?.statusCode === '0000') {
        bkashURL = bkashRes.bkashURL;
        bkashPaymentID = bkashRes.paymentID;
        // Store bkashPaymentID in payment record
        await Payment.findByIdAndUpdate(paymentId, { bkashPaymentID }, { session });
      }
    } catch (error) {
      console.log('bKash API not available, using development mode');
      // Development mode: Create mock payment data
      bkashURL = `https://sandbox.bka.sh/payment?paymentID=DEV-${Date.now()}`;
      bkashPaymentID = `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await Payment.findByIdAndUpdate(paymentId, { bkashPaymentID }, { session });
    }

    await session.commitTransaction();
    session.endSession();

    // Notify lawyer about new appointment request
    try {
      const populatedAppointment = await Appointment.findById(appointmentId)
        .populate("clientId", "profileInfo")
        .populate("lawyerId", "profile_Details");

      if (populatedAppointment) {
        await NotificationHelper.notifyAppointmentCreated(populatedAppointment);
      }
    } catch (error) {
      console.error("Error sending appointment notification:", error);
    }

    return {
      appointmentId,
      bkashURL,
      bkashPaymentID,
      transactionId: payment[0].transactionId,
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to create appointment: ${error}`,
    );
  }
};

const getAllAppointments = async (query: Record<string, string>) => {
  const appointments = Appointment.find()
    .populate("clientId", "_id profileInfo")
    .populate("lawyerId", "_id profile_Details")
    .populate(
      "paymentId",
      "_id amount type status description createdAt updatedAt",
    );

  const queryBuilder = new QueryBuilder(appointments, query);

  const allAppointments = queryBuilder.filter().sort().paginate();

  const [data, meta] = await Promise.all([
    allAppointments.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getMyAppointments = async (
  decodedUser: JwtPayload,
  query: Record<string, string>,
) => {
  if (!decodedUser.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized user");
  }

  let filterQuery = {};

  const lawyer = await LawyerProfileModel.findOne({
    userId: decodedUser.userId,
  });
  let client = await ClientProfileModel.findOne({
    userId: decodedUser.userId,
  });

  if (lawyer) {
    filterQuery = { lawyerId: lawyer._id };
  } else if (client) {
    filterQuery = { clientId: client._id };
  } else {
    // Auto-create client profile if missing
    client = await ClientProfileModel.create({
      userId: new Types.ObjectId(decodedUser.userId),
      profileInfo: {},
      gender: 'MALE',
    });
    await UserModel.findByIdAndUpdate(decodedUser.userId, { client: client._id });
    filterQuery = { clientId: client._id };
  }

  const appointments = Appointment.find(filterQuery)
    .populate({
      path: 'lawyerId',
      select: '_id profile_Details userId',
      populate: {
        path: 'userId',
        select: 'profilePhoto',
      },
    })
    .populate('clientId', '_id profileInfo')
    .populate(
      'paymentId',
      '_id amount type status description createdAt updatedAt',
    )
    .sort({ createdAt: -1 });

  const queryBuilder = new QueryBuilder(appointments, query);

  const myAppointments = queryBuilder.filter().paginate();

  const [data, meta] = await Promise.all([
    myAppointments.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getSingleAppointment = async (id: string, decodedUser: JwtPayload) => {
  const appointment = await Appointment.findById(id)
    .populate("clientId", "_id profileInfo")
    .populate("lawyerId", "_id profile_Details")
    .populate(
      "paymentId",
      "_id amount type status description createdAt updatedAt",
    );

  if (!appointment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Appointment not found");
  }

  // Check authorization
  const lawyer = await LawyerProfileModel.findOne({
    userId: decodedUser.userId,
  });
  const client = await ClientProfileModel.findOne({
    userId: decodedUser.userId,
  });

  const isAuthorized =
    (lawyer && appointment.lawyerId._id.equals(lawyer._id)) ||
    (client && appointment.clientId._id.equals(client._id));

  if (!isAuthorized && decodedUser.role !== ERole.SUPER_ADMIN) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to view this appointment",
    );
  }

  return appointment;
};

const updateAppointment = async (
  id: string,
  decodedUser: JwtPayload,
  payload: Partial<IAppointment>,
) => {
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Appointment not found");
  }

  // Only client can update their own appointment
  const client = await ClientProfileModel.findOne({
    userId: decodedUser.userId,
  });
  if (!client || !appointment.clientId.equals(client._id)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only update your own appointments",
    );
  }

  // Cannot update if already confirmed or completed
  if (
    [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED].includes(
      appointment.status,
    )
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot update confirmed or completed appointments",
    );
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(id, payload, {
    new: true,
  })
    .populate("clientId", "_id profileInfo")
    .populate("lawyerId", "_id profile_Details")
    .populate(
      "paymentId",
      "_id amount type status description createdAt updatedAt",
    );

  return updatedAppointment;
};

const updateAppointmentStatus = async (
  id: string,
  decodedUser: JwtPayload,
  status: AppointmentStatus,
  req: Request,
) => {
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Appointment not found");
  }

  // Lawyer can confirm/reject, client can cancel
  const lawyer = await LawyerProfileModel.findOne({
    userId: decodedUser.userId,
  });
  const client = await ClientProfileModel.findOne({
    userId: decodedUser.userId,
  });

  if (lawyer && appointment.lawyerId.equals(lawyer._id)) {
    // Lawyer can confirm, reject, or complete
    if (
      ![
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.REJECTED,
        AppointmentStatus.COMPLETED,
      ].includes(status)
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Lawyer can only confirm, reject, or complete appointments",
      );
    }
  } else if (client && appointment.clientId.equals(client._id)) {
    // Client can only cancel if appointment is still pending

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Cannot cancel a confirmed or completed appointment",
      );
    }

    if (status !== AppointmentStatus.CANCELLED) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Client can only cancel appointments",
      );
    }
  } else {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Unauthorized to update this appointment",
    );
  }

  appointment.status = status;
  await appointment.save();

  // Populate appointment for notifications
  const populatedAppointment = await Appointment.findById(id)
    .populate("clientId", "profileInfo")
    .populate("lawyerId", "profile_Details");

  // Send notifications based on status
  try {
    if (status === AppointmentStatus.CONFIRMED && populatedAppointment) {
      await NotificationHelper.notifyAppointmentConfirmed(populatedAppointment);
    } else if (status === AppointmentStatus.REJECTED && populatedAppointment) {
      await NotificationHelper.notifyAppointmentDeclined(populatedAppointment);
    } else if (status === AppointmentStatus.CANCELLED && populatedAppointment) {
      await NotificationHelper.notifyAppointmentCancelled(
        populatedAppointment,
        decodedUser.userId,
      );
    } else if (status === AppointmentStatus.COMPLETED && populatedAppointment) {
      await NotificationHelper.notifyAppointmentCompleted(populatedAppointment);
    }
  } catch (error) {
    console.error("Error sending appointment status notification:", error);
  }

  // Create Conversation when appointment is confirmed
  if (status === AppointmentStatus.CONFIRMED) {
    try {
      const conversation = await ConversationModel.findOne({
        appointmentId: id,
      });

      const lawyerUser = await UserModel.findOne({
        role: "LAWYER",
        lawyer: appointment.lawyerId,
      });
      const clientUser = await UserModel.findOne({
        role: "CLIENT",
        client: appointment.clientId,
      });

      if (!lawyerUser && !clientUser) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "lawyer and client user not found",
        );
      }

      if (!conversation) {
        const Conversation = await ConversationModel.create({
          appointmentId: id,
          lawyerUserId: lawyerUser?._id.toString(),
          clientUserId: clientUser?._id.toString(),
          isActive: true,
        });

        // Emit Socket.io event to both lawyer and client
        if (req.io) {
          const lawyerProfile = await LawyerProfileModel.findById(
            appointment.lawyerId,
          );
          const clientProfile = await ClientProfileModel.findById(
            appointment.clientId,
          );

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
    } catch (error) {
      console.error("Error creating Conversation:", error);
      // Don't fail the appointment status update if Conversation creation fails
    }
  }

  // Deactivate Conversation when appointment is cancelled or rejected
  if (
    status === AppointmentStatus.CANCELLED ||
    status === AppointmentStatus.REJECTED
  ) {
    try {
      const existingConversation = await ConversationModel.findById(id);

      if (!existingConversation) {
        throw new AppError(StatusCodes.NOT_FOUND, "Conversation not found");
      }

      existingConversation.isActive = false;
      await existingConversation.save();
    } catch (error) {
      console.error("Error deactivating Conversation:", error);
    }
  }

  return await Appointment.findById(id)
    .populate("clientId", "_id profileInfo")
    .populate("lawyerId", "_id profile_Details")
    .populate(
      "paymentId",
      "_id amount type status description createdAt updatedAt",
    );
};

const updatePaymentStatus = async (
  id: string,
  paymentStatus: AppointmentPaymentStatus,
) => {
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Appointment not found");
  }

  appointment.payment_Status = paymentStatus;
  await appointment.save();

  // Update related payment record
  if (paymentStatus === AppointmentPaymentStatus.PAID) {
    await Payment.findByIdAndUpdate(appointment.paymentId, {
      status: PaymentStatus.PAID,
    });

    // Update wallet with platform fee deduction
    const payment = await Payment.findById(appointment.paymentId);
    if (payment) {
      const lawyer = await LawyerProfileModel.findById(appointment.lawyerId);
      const platformFeePercent = lawyer?.platform_fee_percentage ?? 10; // default 10%
      const platformFee = Math.round((payment.amount * platformFeePercent) / 100);
      const lawyerEarning = payment.amount - platformFee;

      await WalletModel.findOneAndUpdate(
        { lawyerId: appointment.lawyerId },
        {
          $inc: {
            balance: lawyerEarning,
            totalEarned: lawyerEarning,
            totalPlatformFee: platformFee,
          },
          $push: { transactions: payment._id },
        },
        { upsert: true },
      );
    }
  }

  return await Appointment.findById(id)
    .populate("clientId", "_id profileInfo")
    .populate("lawyerId", "_id profile_Details")
    .populate(
      "paymentId",
      "_id amount type status description createdAt updatedAt",
    );
};

const rescheduleAppointment = async (
  id: string,
  decodedUser: JwtPayload,
  newDate: string,
  newTime: string,
) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Appointment not found");
  }

  // Only client can reschedule their confirmed appointments
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  if (!client || !appointment.clientId.equals(client._id)) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can only reschedule your own appointments");
  }

  if (appointment.status !== AppointmentStatus.CONFIRMED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Only confirmed appointments can be rescheduled");
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
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Appointments can only be rescheduled at least 4 hours in advance"
    );
  }

  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const newAppointmentDate = new Date(newDate);
    
    // Check if new slot is available
    const isNewSlotBooked = await AvailabilityModel.findOne({
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
      throw new AppError(StatusCodes.BAD_REQUEST, "The new time slot is not available");
    }

    // Release old slot
    await AvailabilityModel.updateOne(
      {
        lawyerId: appointment.lawyerId,
        "availableDates.date": appointmentDateTime,
        "availableDates.schedules.time": appointment.selectedTime,
      },
      {
        $set: {
          "availableDates.$[date].schedules.$[schedules].isBooked": false,
          "availableDates.$[date].schedules.$[schedules].status": "available",
          "availableDates.$[date].schedules.$[schedules].bookedBy": null,
        },
      },
      {
        arrayFilters: [
          { "date.date": appointmentDateTime },
          { "schedules.time": appointment.selectedTime },
        ],
        session,
      },
    );

    // Book new slot
    await AvailabilityModel.updateOne(
      {
        lawyerId: appointment.lawyerId,
        "availableDates.date": newAppointmentDate,
        "availableDates.schedules.time": newTime,
      },
      {
        $set: {
          "availableDates.$[date].schedules.$[schedules].isBooked": true,
          "availableDates.$[date].schedules.$[schedules].status": "booked",
          "availableDates.$[date].schedules.$[schedules].bookedBy": decodedUser.userId,
        },
      },
      {
        arrayFilters: [
          { "date.date": newAppointmentDate },
          { "schedules.time": newTime },
        ],
        session,
      },
    );

    // Update appointment
    appointment.appointmentDate = newAppointmentDate;
    appointment.selectedTime = newTime;
    await appointment.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send notifications
    const populatedAppointment = await Appointment.findById(id)
      .populate("clientId", "profileInfo")
      .populate("lawyerId", "profile_Details");

    if (populatedAppointment) {
      await NotificationHelper.notifyAppointmentRescheduled(populatedAppointment);
    }

    return populatedAppointment;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw error;
  }
};

const cancelAppointmentWithRefund = async (
  id: string,
  decodedUser: JwtPayload,
  reason?: string,
) => {
  const appointment = await Appointment.findById(id).populate('paymentId');
  if (!appointment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Appointment not found");
  }

  // Check authorization
  const client = await ClientProfileModel.findOne({ userId: decodedUser.userId });
  const lawyer = await LawyerProfileModel.findOne({ userId: decodedUser.userId });
  
  const isClient = client && appointment.clientId.equals(client._id);
  const isLawyer = lawyer && appointment.lawyerId.equals(lawyer._id);
  
  if (!isClient && !isLawyer) {
    throw new AppError(StatusCodes.FORBIDDEN, "Unauthorized to cancel this appointment");
  }

  if (![AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(appointment.status)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Cannot cancel completed or already cancelled appointments");
  }

  const session = await mongoose.startSession();
  
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
      if (hoursDiff >= 24) refundPercentage = 90; // 90% refund if cancelled 24+ hours before
      else if (hoursDiff >= 4) refundPercentage = 50; // 50% refund if cancelled 4-24 hours before
      else refundPercentage = 0; // No refund if cancelled less than 4 hours before
    } else if (isLawyer) {
      // Lawyer cancellation - full refund to client
      refundPercentage = 100;
    }

    // Update appointment status
    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = reason;
    appointment.cancelledBy = decodedUser.userId;
    appointment.cancelledAt = new Date();
    await appointment.save({ session });

    // Release time slot
    const appointmentDate = new Date(appointment.appointmentDate);
    await AvailabilityModel.updateOne(
      {
        lawyerId: appointment.lawyerId,
        "availableDates.date": appointmentDate,
        "availableDates.schedules.time": appointment.selectedTime,
      },
      {
        $set: {
          "availableDates.$[date].schedules.$[schedules].isBooked": false,
          "availableDates.$[date].schedules.$[schedules].status": "available",
          "availableDates.$[date].schedules.$[schedules].bookedBy": null,
        },
      },
      {
        arrayFilters: [
          { "date.date": appointmentDate },
          { "schedules.time": appointment.selectedTime },
        ],
        session,
      },
    );

    // Process refund if applicable
    let refundAmount = 0;
    if (refundPercentage > 0 && appointment.payment_Status === 'PAID') {
      const payment = appointment.paymentId as any;
      refundAmount = Math.round((payment.amount * refundPercentage) / 100);
      
      // Create refund record
      await Payment.create([
        {
          lawyerId: appointment.lawyerId,
          clientId: appointment.clientId,
          appointmentId: appointment._id,
          transactionId: `REFUND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          amount: refundAmount,
          type: PaymentType.REFUND,
          status: PaymentStatus.REFUNDED,
          description: `Refund for cancelled appointment (${refundPercentage}% of ৳${payment.amount})`,
        },
      ], { session });
      
      // Update lawyer wallet (deduct refund amount)
      await WalletModel.findOneAndUpdate(
        { lawyerId: appointment.lawyerId },
        { $inc: { balance: -refundAmount } },
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    // Send notifications
    const populatedAppointment = await Appointment.findById(id)
      .populate("clientId", "profileInfo")
      .populate("lawyerId", "profile_Details");

    if (populatedAppointment) {
      await NotificationHelper.notifyAppointmentCancelled(populatedAppointment, decodedUser.userId, refundAmount);
    }

    return {
      appointment: populatedAppointment,
      refundAmount,
      refundPercentage,
      message: refundAmount > 0 
        ? `Appointment cancelled. ৳${refundAmount} refund will be processed to your wallet.`
        : 'Appointment cancelled.'
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw error;
  }
};

const getAppointmentStats = async () => {
  const stats = await Appointment.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalAppointments = await Appointment.countDocuments();
  const upcomingAppointments = await Appointment.countDocuments({
    appointmentDateTime: { $gte: new Date() },
    status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
  });

  return {
    stats,
    totalAppointments,
    upcomingAppointments,
  };
};

const cancelUnpaidAppointments = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  // const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (error) {
    session = null;
  }

  try {
    // Find all unpaid appointments older than 30 minutes
    const unpaidAppointments = await Appointment.find({
      payment_Status: AppointmentPaymentStatus.UNPAID,
      createdAt: { $lte: thirtyMinutesAgo },
    }).session(session);

    if (unpaidAppointments.length === 0) {
      if (session) {
        await session.commitTransaction();
        session.endSession();
      }
      return {
        success: true,
        cancelledCount: 0,
        message: "No unpaid appointments to cancel",
      };
    }

    let cancelledCount = 0;
    const errors: string[] = [];

    for (const appointment of unpaidAppointments) {
      try {
        // 1. Delete related payment
        const deletedPayment = await Payment.findByIdAndDelete(
          appointment.paymentId,
          session ? { session } : {},
        );

        if (deletedPayment) {
          // 2. Update wallet - no need to update since payment was never confirmed
          // Wallet is only updated when payment status becomes PAID
        }

        // 3. Update availability - mark slot as available
        const appointmentDate = new Date(appointment.appointmentDate);
        const selectedTime = appointment.selectedTime;

        await AvailabilityModel.updateOne(
          {
            lawyerId: appointment.lawyerId,
            "availableDates.date": appointmentDate,
            "availableDates.schedules.time": selectedTime,
          },
          {
            $set: {
              "availableDates.$[date].schedules.$[schedules].isBooked": false,
              "availableDates.$[date].schedules.$[schedules].status":
                "available",
              "availableDates.$[date].schedules.$[schedules].bookedBy": null,
            },
          },
          {
            arrayFilters: [
              { "date.date": appointmentDate },
              { "schedules.time": selectedTime },
            ],
            ...(session ? { session } : {}),
          },
        );

        // 4. Delete appointment
        await Appointment.findByIdAndDelete(
          appointment._id,
          session ? { session } : {},
        );
        console.log(`✅ Deleted appointment: ${appointment._id}`);

        cancelledCount++;
      } catch (error) {
        const errorMsg = `Failed to cancel appointment ${appointment._id}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Commit transaction
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    return {
      success: true,
      cancelledCount,
      totalFound: unpaidAppointments.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully cancelled ${cancelledCount} unpaid appointments`,
    };
  } catch (error) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
      session.endSession();
      console.error("🔄 Transaction rolled back due to error");
    }

    console.error("❌ Error in cancelUnpaidAppointments:", error);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to cancel unpaid appointments: ${error}`,
    );
  }
};

export const appointmentService = {
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
