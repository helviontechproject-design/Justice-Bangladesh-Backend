"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaymentStatusZod = exports.updatePaymentZod = exports.createPaymentZod = void 0;
const zod_1 = require("zod");
const payment_interface_1 = require("./payment.interface");
exports.createPaymentZod = zod_1.z.object({
    lawyerId: zod_1.z.string().min(1, 'Lawyer ID is required'),
    clientId: zod_1.z.string().min(1, 'Client ID is required'),
    appointmentId: zod_1.z.string().min(1, 'Appointment ID is required'),
    transactionId: zod_1.z.string().min(1, 'Transaction ID is required'),
    amount: zod_1.z.number().min(0, 'Amount must be positive'),
    type: zod_1.z.nativeEnum(payment_interface_1.PaymentType),
    status: zod_1.z.nativeEnum(payment_interface_1.PaymentStatus).optional().default(payment_interface_1.PaymentStatus.UNPAID),
    description: zod_1.z.string().optional(),
    gateway: zod_1.z.string().min(1, 'Payment gateway is required'),
    invoiceUrl: zod_1.z.string().url('Invalid invoice URL').optional(),
});
exports.updatePaymentZod = zod_1.z.object({
    status: zod_1.z.nativeEnum(payment_interface_1.PaymentStatus).optional(),
    description: zod_1.z.string().optional(),
    invoiceUrl: zod_1.z.string().url('Invalid invoice URL').optional(),
});
exports.updatePaymentStatusZod = zod_1.z.object({
    status: zod_1.z.nativeEnum(payment_interface_1.PaymentStatus),
});
