import { z } from 'zod';
import { AppointmentPaymentStatus, AppointmentStatus, AppointmentType } from './appointment.interface';

export const createAppointmentZod = z.object({
  lawyerId: z.string().min(1, 'Lawyer ID is required'),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  selectedTime: z.string(),
  appointmentType: z.nativeEnum(AppointmentType),
  caseType: z.string().min(1, 'Case type is required'),
  note: z.string().optional(),
  documents: z.array(z.string()).optional().default([]),
  videoCallingTime: z.number().optional().default(30),
});

export const updateAppointmentZod = z.object({
  appointmentDateTime: z.string().optional(),
  appointmentType: z.nativeEnum(AppointmentType).optional(),
  caseType: z.string().optional(),
  note: z.string().optional(),
  documents: z.array(z.string()).optional(),
  videoCallingTime: z.number().optional(),
});

export const updateAppointmentStatusZod = z.object({
  status: z.enum(AppointmentStatus),
});

export const updatePaymentStatusZod = z.object({
  paymentStatus: z.enum(AppointmentPaymentStatus),
});


export type CreateAppointmentInput = z.infer<typeof createAppointmentZod>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentZod>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusZod>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusZod>;
