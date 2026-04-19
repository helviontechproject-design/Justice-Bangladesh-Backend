import { Schema, model } from 'mongoose';
import {
  IAvailability,
  IAvailableDate,
  ISchedule,
} from './availability.interface';

const ScheduleSchema = new Schema<ISchedule>(
  {
    time: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['available', 'booked', 'pending', 'cancelled'],
      default: 'available',
    },
    bookedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  }
);

const AvailableDateSchema = new Schema<IAvailableDate>(
  {
    date: { type: Date, required: true },
    schedules: { type: [ScheduleSchema], required: true },
  },
  { _id: false }
);


const AvailabilitySchema = new Schema<IAvailability>(
  {
    lawyerId: {
      type: Schema.Types.ObjectId,
      ref: 'LawyerProfile',
      required: true,
    },
    bookingType: {
      type: String,
      enum: ['Video Call', 'Audio Call', 'In Person'],
      required: true,
    },
    month: { type: String, required: true },
    availableDates: { type: [AvailableDateSchema], required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const AvailabilityModel = model<IAvailability>(
  'Availability',
  AvailabilitySchema
);
