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

  const client = await ClientProfileModel.findOne({
    userId: decodedUser.userId,
  });
  if (!client) {
    throw new AppError(StatusCodes.NOT_FOUND, "Client profile not found");
  }

  const lawyer = await LawyerProfileModel.findById(payload.lawyerId);
  if (!lawyer) {
    throw new AppError(StatusCodes.NOT_FOUND, "Lawyer not found");
  }

  // Extract date & time properly
  const appointmentDate = new Date(payload.appointmentDate!);

  const selectedTime = payload.selectedTime;

  const isBooked = await AvailabilityModel.findOne({
    lawyerId: payload.lawyerId,
    availableDates: {
      $elemMatch: {
        date: appointmentDate,
        schedules: {
          $elemMatch: {
            time: selectedTime,
            isBooked: true,
          },
        },
      },
    },
  });

  if (isBooked) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This time slot is already booked",
    );
  }

  const availableThis = await AvailabilityModel.findOne({
    lawyerId: payload.lawyerId,
    availableDates: {
      $elemMatch: {
        date: appointmentDate,
        schedules: {
          $elemMatch: {
            time: selectedTime,
          },
        },
      },
    },
  });

  if (!availableThis) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This time slot is not available",
    );
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const videoCallingId = `VC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (lawyer.per_consultation_fee === 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Consultation fee is not set",
      );
    }

    const payment = await Payment.create(
      [
        {
          lawyerId: payload.lawyerId,
          clientId: client._id,
          appointmentId: null,
          transactionId,
          amount: lawyer.per_consultation_fee || 0,
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

    // Update slot as booked
    await AvailabilityModel.updateOne(
      {
        lawyerId: payload.lawyerId,
        "availableDates.date": appointmentDate,
        "availableDates.schedules.time": selectedTime,
      },
      {
        $set: {
          "availableDates.$[date].schedules.$[schedules].isBooked": true,
          "availableDates.$[date].schedules.$[schedules].status": "pending",
          "availableDates.$[date].schedules.$[schedules].bookedBy":
            decodedUser.userId,
        },
      },
      {
        arrayFilters: [
          { "date.date": appointmentDate },
          { "schedules.time": selectedTime },
        ],
        session,
      },
    );

    // update lawyer profile to plus appointments_Count
    const lawyerProfile = await LawyerProfileModel.findByIdAndUpdate(
      payload.lawyerId,
      {
        $inc: { appointments_Count: 1 },
      },
      { session },
    );

    const userEmail = client.profileInfo.email || "demo@gmail.com";
    const userName =
      client.profileInfo.fast_name + " " + client.profileInfo.last_name;

    // bKash payment init
    const orderId = `APT-${transactionId}`;
    const bkashRes = await BkashService.createPayment({
      amount: String(payment[0].amount),
      orderId,
      merchantInvoiceNumber: orderId,
    }) as any;

    let bkashURL: string | null = null;
    let bkashPaymentID: string | null = null;

    if (bkashRes?.statusCode === '0000') {
      bkashURL = bkashRes.bkashURL;
      bkashPaymentID = bkashRes.paymentID;
      // Store bkashPaymentID in payment record
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
  const client = await ClientProfileModel.findOne({
    userId: decodedUser.userId,
  });

  if (lawyer) {
    filterQuery = { lawyerId: lawyer._id };
  } else if (client) {
    filterQuery = { clientId: client._id };
  } else {
    throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");
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

    // Update wallet - move from pending to balance
    const payment = await Payment.findById(appointment.paymentId);
    if (payment) {
      await WalletModel.findOneAndUpdate(
        { lawyerId: appointment.lawyerId },
        {
          $inc: {
            balance: payment.amount,
            totalEarned: payment.amount,
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

const deleteAppointment = async (id: string, decodedUser: JwtPayload) => {
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Appointment not found");
  }

  // Only client can delete their pending appointments
  const client = await ClientProfileModel.findOne({
    userId: decodedUser.userId,
  });
  if (!client || !appointment.clientId.equals(client._id)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only delete your own appointments",
    );
  }

  if (appointment.status !== AppointmentStatus.PENDING) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Can only delete pending appointments",
    );
  }

  await Appointment.findByIdAndDelete(id);
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
  deleteAppointment,
  getAppointmentStats,
  cancelUnpaidAppointments,
};
