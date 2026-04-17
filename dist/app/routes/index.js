"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const user_route_1 = require("../modules/user/user.route");
const auth_route_1 = require("../modules/auth/auth.route");
const availability_route_1 = require("../modules/availability/availability.route");
const wallet_route_1 = require("../modules/wallet/wallet.route");
const payment_route_1 = require("../modules/payment/payment.route");
const appointment_route_1 = require("../modules/appointment/appointment.route");
const review_route_1 = require("../modules/review/review.route");
const lawyerSpecialties_route_1 = require("../modules/lawyerSpecialties/lawyerSpecialties.route");
const category_route_1 = require("../modules/category/category.route");
const notification_route_1 = require("../modules/notification/notification.route");
const broadcast_route_1 = require("../modules/notification/broadcast.route");
const banner_route_1 = require("../modules/banner/banner.route");
const lawyer_route_1 = require("../modules/lawyer/lawyer.route");
const client_route_1 = require("../modules/client/client.route");
const service_route_1 = require("../modules/service/service.route");
const stats_route_1 = require("../modules/stats/stats.route");
const message_route_1 = require("../modules/chat/message/message.route");
const conversation_route_1 = require("../modules/chat/conversation/conversation.route");
const payout_route_1 = require("../modules/payout/payout.route");
const blog_route_1 = require("../modules/blog/blog.route");
const agora_route_1 = require("../modules/agora/agora.route");
const faq_route_1 = require("../modules/faq/faq.route");
const policy_route_1 = require("../modules/policy/policy.route");
const settings_route_1 = require("../modules/settings/settings.route");
const serviceBooking_route_1 = require("../modules/serviceBooking/serviceBooking.route");
const instantConsultancy_route_1 = require("../modules/instantConsultancy/instantConsultancy.route");
const bkash_route_1 = require("../modules/bkash/bkash.route");
const report_route_1 = require("../modules/report/report.route");
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: '/user',
        route: user_route_1.userRoute,
    },
    {
        path: '/auth',
        route: auth_route_1.authRoute,
    },
    {
        path: '/availability',
        route: availability_route_1.availabilityRoute,
    },
    {
        path: '/wallet',
        route: wallet_route_1.walletRoute,
    },
    {
        path: '/payment',
        route: payment_route_1.paymentRoute,
    },
    {
        path: '/appointment',
        route: appointment_route_1.appointmentRoute,
    },
    {
        path: '/payout',
        route: payout_route_1.payoutRoute,
    },
    {
        path: '/review',
        route: review_route_1.reviewRoute,
    },
    {
        path: '/lawyer-specialties',
        route: lawyerSpecialties_route_1.lawyerSpecialtiesRoute,
    },
    {
        path: '/category',
        route: category_route_1.categoryRoute,
    },
    {
        path: '/service',
        route: service_route_1.serviceRoute,
    },
    {
        path: '/notification',
        route: notification_route_1.notificationRoute,
    },
    {
        path: '/broadcast',
        route: broadcast_route_1.broadcastRoute,
    },
    {
        path: '/banner',
        route: banner_route_1.bannerRoute,
    },
    {
        path: '/lawyer',
        route: lawyer_route_1.lawyerRoute,
    },
    {
        path: '/client',
        route: client_route_1.clientRoute,
    },
    {
        path: '/stats',
        route: stats_route_1.statsRoute,
    },
    {
        path: '/message',
        route: message_route_1.messageRoute
    },
    {
        path: '/conversation',
        route: conversation_route_1.conversationRoute
    },
    {
        path: '/blog',
        route: blog_route_1.blogRoute
    },
    {
        path: '/agora',
        route: agora_route_1.agoraRoute
    },
    {
        path: '/settings',
        route: settings_route_1.settingsRoutes
    },
    {
        path: '/faq',
        route: faq_route_1.faqRoute
    },
    {
        path: '/policy',
        route: policy_route_1.policyRoute
    },
    {
        path: '/report',
        route: report_route_1.reportRoute
    },
    {
        path: '/service-booking',
        route: serviceBooking_route_1.serviceBookingRoute
    },
    {
        path: '/bkash',
        route: bkash_route_1.bkashRoute
    },
    {
        path: '/instant-consultancy',
        route: instantConsultancy_route_1.instantConsultancyRoute
    }
];
moduleRoutes.forEach(route => {
    exports.router.use(route.path, route.route);
});
