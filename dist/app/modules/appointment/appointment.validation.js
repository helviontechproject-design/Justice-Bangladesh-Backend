"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaymentStatusZod = exports.updateAppointmentStatusZod = exports.updateAppointmentZod = exports.createAppointmentZod = void 0;
const zod_1 = require("zod");
const appointment_interface_1 = require("./appointment.interface");
exports.createAppointmentZod = zod_1.z.object({
    lawyerId: zod_1.z.string().min(1, 'Lawyer ID is required'),
    appointmentDate: zod_1.z.string().min(1, 'Appointment date is required'),
    selectedTime: zod_1.z.string(),
    appointmentType: zod_1.z.nativeEnum(appointment_interface_1.AppointmentType),
    caseType: zod_1.z.string().min(1, 'Case type is required'),
    note: zod_1.z.string().optional(),
    documents: zod_1.z.array(zod_1.z.string()).optional().default([]),
    videoCallingTime: zod_1.z.number().optional().default(30),
});
exports.updateAppointmentZod = zod_1.z.object({
    appointmentDateTime: zod_1.z.string().optional(),
    appointmentType: zod_1.z.nativeEnum(appointment_interface_1.AppointmentType).optional(),
    caseType: zod_1.z.string().optional(),
    note: zod_1.z.string().optional(),
    documents: zod_1.z.array(zod_1.z.string()).optional(),
    videoCallingTime: zod_1.z.number().optional(),
});
exports.updateAppointmentStatusZod = zod_1.z.object({
    status: zod_1.z.enum(appointment_interface_1.AppointmentStatus),
});
exports.updatePaymentStatusZod = zod_1.z.object({
    paymentStatus: zod_1.z.enum(appointment_interface_1.AppointmentPaymentStatus),
});
