"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityModel = void 0;
const mongoose_1 = require("mongoose");
const ScheduleSchema = new mongoose_1.Schema({
    time: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['available', 'booked', 'pending', 'cancelled'],
        default: 'available',
    },
    bookedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
});
const AvailableDateSchema = new mongoose_1.Schema({
    date: { type: Date, required: true },
    schedules: { type: [ScheduleSchema], required: true },
}, { _id: false });
const AvailabilitySchema = new mongoose_1.Schema({
    lawyerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'LawyerProfile',
        required: true,
    },
    bookingType: {
        type: String,
        enum: ['online', 'In Persona', 'chat'],
        required: true,
    },
    month: { type: String, required: true },
    availableDates: { type: [AvailableDateSchema], required: true },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});
exports.AvailabilityModel = (0, mongoose_1.model)('Availability', AvailabilitySchema);
