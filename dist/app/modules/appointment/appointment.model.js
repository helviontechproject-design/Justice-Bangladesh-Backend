"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Appointment = void 0;
const mongoose_1 = require("mongoose");
const appointment_interface_1 = require("./appointment.interface");
const appointmentSchema = new mongoose_1.Schema({
    clientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ClientProfile',
        required: false,
    },
    lawyerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'LawyerProfile',
        required: true,
    },
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: Object.values(appointment_interface_1.AppointmentType),
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
        enum: Object.values(appointment_interface_1.AppointmentStatus),
        default: appointment_interface_1.AppointmentStatus.PENDING,
        required: true,
    },
    payment_Status: {
        type: String,
        enum: Object.values(appointment_interface_1.AppointmentPaymentStatus),
        default: appointment_interface_1.AppointmentPaymentStatus.UNPAID,
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Appointment = (0, mongoose_1.model)('Appointment', appointmentSchema);
