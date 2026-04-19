import { Types } from 'mongoose';

export type ScheduleStatus = 'available' | 'booked' | 'pending' | 'cancelled';
export type BookingType = 'Video Call' | 'Audio Call' | 'In Person';

export interface ISchedule {
  time: string;
  isBooked: boolean;
  status: ScheduleStatus;
  bookedBy?: string | Types.ObjectId;
}

export interface IAvailableDate {
  date: Date;
  schedules: ISchedule[];
}

export interface IAvailability {
  _id: Types.ObjectId;
  lawyerId: Types.ObjectId;
  bookingType: BookingType;
  month: string;
  availableDates: IAvailableDate[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
