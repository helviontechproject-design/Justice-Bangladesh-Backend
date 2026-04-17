import { Schema, model } from 'mongoose';
import {
  IAppointment,
  AppointmentStatus,
  AppointmentType,
  AppointmentPaymentStatus,
} from './appointment.interface';

const appointmentSchema = new Schema<IAppointment>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientProfile',
      required: false,
    },
    lawyerId: {
      type: Schema.Types.ObjectId,
      ref: 'LawyerProfile',
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: false,
    },
    videoCallingId: {
      type: String,
      required: true,
      trim: true,
    },
    videoCallingTime: {
      type: Number,
      default: 5,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    selectedTime: {
      type: String,
      required: true,
    },
    appointmentType: {
      type: String,
      enum: Object.values(AppointmentType),
      required: true,
    },
    caseType: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    documents: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.PENDING,
      required: true,
    },
    payment_Status: {
      type: String,
      enum: Object.values(AppointmentPaymentStatus),
      default: AppointmentPaymentStatus.UNPAID,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Appointment = model<IAppointment>(
  'Appointment',
  appointmentSchema
);
