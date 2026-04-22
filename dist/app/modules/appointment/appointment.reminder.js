"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentReminderService = exports.initializeReminderSystem = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const appointment_model_1 = require("./appointment.model");
const appointment_interface_1 = require("./appointment.interface");
const notification_helper_1 = require("../notification/notification.helper");
// Send reminder 24 hours before appointment
const sendDailyReminders = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        const appointments = yield appointment_model_1.Appointment.find({
            appointmentDate: {
                $gte: tomorrow,
                $lt: dayAfterTomorrow
            },
            status: appointment_interface_1.AppointmentStatus.CONFIRMED,
            payment_Status: 'PAID'
        })
            .populate('clientId', 'profileInfo')
            .populate('lawyerId', 'profile_Details');
        for (const appointment of appointments) {
            try {
                yield notification_helper_1.NotificationHelper.sendAppointmentReminder(appointment, '24 hours');
                console.log(`✅ 24h reminder sent for appointment: ${appointment._id}`);
            }
            catch (error) {
                console.error(`❌ Failed to send 24h reminder for appointment ${appointment._id}:`, error);
            }
        }
        console.log(`📅 Daily reminder check completed. Found ${appointments.length} appointments for tomorrow.`);
    }
    catch (error) {
        console.error('❌ Error in sendDailyReminders:', error);
    }
});
// Send reminder 1 hour before appointment
const sendHourlyReminders = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const oneHourLater = new Date();
        oneHourLater.setHours(oneHourLater.getHours() + 1);
        const twoHoursLater = new Date();
        twoHoursLater.setHours(twoHoursLater.getHours() + 2);
        const appointments = yield appointment_model_1.Appointment.find({
            appointmentDate: {
                $gte: oneHourLater,
                $lt: twoHoursLater
            },
            status: appointment_interface_1.AppointmentStatus.CONFIRMED,
            payment_Status: 'PAID'
        })
            .populate('clientId', 'profileInfo')
            .populate('lawyerId', 'profile_Details');
        for (const appointment of appointments) {
            try {
                // Parse appointment time
                const appointmentTime = appointment.selectedTime;
                const appointmentDate = new Date(appointment.appointmentDate);
                // Convert time string to 24-hour format
                const [time, period] = appointmentTime.split(' ');
                const [hours, minutes] = time.split(':').map(Number);
                let hour24 = hours;
                if (period === 'PM' && hours !== 12)
                    hour24 += 12;
                if (period === 'AM' && hours === 12)
                    hour24 = 0;
                appointmentDate.setHours(hour24, minutes, 0, 0);
                const now = new Date();
                const timeDiff = appointmentDate.getTime() - now.getTime();
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                // Send reminder if appointment is within 1-2 hours
                if (hoursDiff >= 0.5 && hoursDiff <= 1.5) {
                    yield notification_helper_1.NotificationHelper.sendAppointmentReminder(appointment, '1 hour');
                    console.log(`✅ 1h reminder sent for appointment: ${appointment._id}`);
                }
            }
            catch (error) {
                console.error(`❌ Failed to send 1h reminder for appointment ${appointment._id}:`, error);
            }
        }
        console.log(`⏰ Hourly reminder check completed. Processed ${appointments.length} appointments.`);
    }
    catch (error) {
        console.error('❌ Error in sendHourlyReminders:', error);
    }
});
// Initialize reminder cron jobs
const initializeReminderSystem = () => {
    // Run daily at 9:00 AM to send 24-hour reminders
    node_cron_1.default.schedule('0 9 * * *', sendDailyReminders, {
        timezone: 'Asia/Dhaka'
    });
    // Run every hour to send 1-hour reminders
    node_cron_1.default.schedule('0 * * * *', sendHourlyReminders, {
        timezone: 'Asia/Dhaka'
    });
    console.log('📅 Appointment reminder system initialized');
};
exports.initializeReminderSystem = initializeReminderSystem;
exports.AppointmentReminderService = {
    sendDailyReminders,
    sendHourlyReminders,
    initializeReminderSystem: exports.initializeReminderSystem
};
