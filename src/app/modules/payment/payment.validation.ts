import { z } from 'zod';
import { PaymentStatus, PaymentType } from './payment.interface';

export const createPaymentZod = z.object({
  lawyerId: z.string().min(1, 'Lawyer ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  type: z.nativeEnum(PaymentType),
  status: z.nativeEnum(PaymentStatus).optional().default(PaymentStatus.UNPAID),
  description: z.string().optional(),
  gateway: z.string().min(1, 'Payment gateway is required'),
  invoiceUrl: z.string().url('Invalid invoice URL').optional(),
});

export const updatePaymentZod = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  description: z.string().optional(),
  invoiceUrl: z.string().url('Invalid invoice URL').optional(),
});

export const updatePaymentStatusZod = z.object({
  status: z.nativeEnum(PaymentStatus),
});

export type CreatePaymentInput = z.infer<typeof createPaymentZod>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentZod>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusZod>;
