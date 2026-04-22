import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { appointmentService } from "./appointment.service";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";

const createAppointment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const files = (req.files ?? {}) as {
      [fieldname: string]: Express.Multer.File[];
    };
    const decodedUser = req.user;
    const payload = {
      ...req.body,
      documents: files["documents"]
        ? files["documents"].map((f) => f.path)
        : [],
    };
    const appointment = await appointmentService.createAppointment(
      decodedUser as JwtPayload,
      payload,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Appointment created successfully",
      data: appointment,
    });
  },
);

const getAllAppointments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await appointmentService.getAllAppointments(
      req.query as Record<string, string>,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Appointments fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getMyAppointments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const result = await appointmentService.getMyAppointments(
      decodedUser as JwtPayload,
      req.query as Record<string, string>,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Your appointments fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getSingleAppointment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const decodedUser = req.user;
    const appointment = await appointmentService.getSingleAppointment(
      id,
      decodedUser as JwtPayload,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Appointment fetched successfully",
      data: appointment,
    });
  },
);

const updateAppointment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const decodedUser = req.user;
    const appointment = await appointmentService.updateAppointment(
      id,
      decodedUser as JwtPayload,
      req.body,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Appointment updated successfully",
      data: appointment,
    });
  },
);

const updateAppointmentStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;
    const decodedUser = req.user;
    const appointment = await appointmentService.updateAppointmentStatus(
      id,
      decodedUser as JwtPayload,
      status,
      req,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Appointment status updated successfully",
      data: appointment,
    });
  },
);

const updatePaymentStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const appointment = await appointmentService.updatePaymentStatus(
      id,
      paymentStatus,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Payment status updated successfully",
      data: appointment,
    });
  },
);

const rescheduleAppointment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { newDate, newTime } = req.body;
    const decodedUser = req.user;
    
    const appointment = await appointmentService.rescheduleAppointment(
      id,
      decodedUser as JwtPayload,
      newDate,
      newTime,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Appointment rescheduled successfully",
      data: appointment,
    });
  },
);

const cancelAppointmentWithRefund = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { reason } = req.body;
    const decodedUser = req.user;
    
    const result = await appointmentService.cancelAppointmentWithRefund(
      id,
      decodedUser as JwtPayload,
      reason,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: result.message,
      data: {
        appointment: result.appointment,
        refundAmount: result.refundAmount,
        refundPercentage: result.refundPercentage,
      },
    });
  },
);

const deleteAppointment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const decodedUser = req.user;
    
    // For now, redirect to cancel with refund
    const result = await appointmentService.cancelAppointmentWithRefund(
      id,
      decodedUser as JwtPayload,
      'Appointment deleted by user',
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Appointment deleted successfully",
      data: result,
    });
  },
);

const getAppointmentStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await appointmentService.getAppointmentStats();

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Appointment statistics fetched successfully",
      data: stats,
    });
  },
);

// Dev controller — skips SSL payment & availability check
const createAppointmentDev = catchAsync(async (req: Request, res: Response) => {
  const { lawyerId, appointmentDate, selectedTime, appointmentType, caseType, note, videoCallingTime, totalFee } = req.body;

  const { Appointment } = await import('./appointment.model');
  const { AppointmentStatus, AppointmentPaymentStatus } = await import('./appointment.interface');

  const videoCallingId = `VC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const appointment = await Appointment.create({
    lawyerId,
    videoCallingId,
    videoCallingTime: Number(videoCallingTime) || 30,
    appointmentDate: new Date(appointmentDate),
    selectedTime: selectedTime || '09:00 AM',
    appointmentType: appointmentType || 'audio',
    caseType: caseType || 'General Consultation',
    note: note || '',
    documents: [],
    status: AppointmentStatus.PENDING,
    payment_Status: AppointmentPaymentStatus.PAID,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Appointment booked successfully',
    data: appointment,
  });
});

// Dev: confirm payment without real gateway
const confirmPaymentDev = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { Appointment } = await import('./appointment.model');
  const { Payment } = await import('../payment/payment.model');
  const { WalletModel } = await import('../wallet/wallet.model');
  const { AppointmentPaymentStatus, AppointmentStatus } = await import('./appointment.interface');
  const { PaymentStatus } = await import('../payment/payment.interface');

  const appointment = await Appointment.findByIdAndUpdate(
    id,
    { payment_Status: AppointmentPaymentStatus.PAID, status: AppointmentStatus.PENDING },
    { new: true }
  );
  if (!appointment) throw new Error('Appointment not found');

  if (appointment.paymentId) {
    const payment = await Payment.findByIdAndUpdate(
      appointment.paymentId,
      { status: PaymentStatus.PAID },
      { new: true }
    );
    if (payment) {
      await WalletModel.findOneAndUpdate(
        { lawyerId: appointment.lawyerId },
        { $inc: { balance: payment.amount, totalEarned: payment.amount }, $push: { transactions: payment._id } },
        { upsert: true }
      );
    }
  }

  sendResponse(res, { success: true, statusCode: 200, message: 'Payment confirmed', data: appointment });
});

// Dev: get all recent appointments without auth
const getMyAppointmentsDev = catchAsync(async (req: Request, res: Response) => {
  const { Appointment } = await import('./appointment.model');
  const appointments = await Appointment.find()
    .populate('lawyerId', 'profile_Details userId')
    .populate({ path: 'lawyerId', populate: { path: 'userId', select: 'profilePhoto' } })
    .sort({ createdAt: -1 })
    .limit(20);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Appointments fetched',
    data: appointments,
    meta: undefined,
  });
});

export const appointmentController = {
  createAppointment,
  createAppointmentDev,
  confirmPaymentDev,
  getAllAppointments,
  getMyAppointments,
  getMyAppointmentsDev,
  getSingleAppointment,
  updateAppointment,
  updateAppointmentStatus,
  updatePaymentStatus,
  rescheduleAppointment,
  cancelAppointmentWithRefund,
  deleteAppointment,
  getAppointmentStats,
};
