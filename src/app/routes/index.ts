import { Router } from 'express';
import { userRoute } from '../modules/user/user.route';
import { authRoute } from '../modules/auth/auth.route';
import { availabilityRoute } from '../modules/availability/availability.route';
import { walletRoute } from '../modules/wallet/wallet.route';
import { paymentRoute } from '../modules/payment/payment.route';
import { appointmentRoute } from '../modules/appointment/appointment.route';
import { reviewRoute } from '../modules/review/review.route';
import { lawyerSpecialtiesRoute } from '../modules/lawyerSpecialties/lawyerSpecialties.route';
import { categoryRoute } from '../modules/category/category.route';
import { notificationRoute } from '../modules/notification/notification.route';
import { broadcastRoute } from '../modules/notification/broadcast.route';
import { bannerRoute } from '../modules/banner/banner.route';
import { lawyerRoute } from '../modules/lawyer/lawyer.route';
import { clientRoute } from '../modules/client/client.route';
import { serviceRoute } from '../modules/service/service.route';
import { statsRoute } from '../modules/stats/stats.route';
import { messageRoute } from '../modules/chat/message/message.route';
import { conversationRoute } from '../modules/chat/conversation/conversation.route';
import { payoutRoute } from '../modules/payout/payout.route';
import { blogRoute } from '../modules/blog/blog.route';
import { agoraRoute } from '../modules/agora/agora.route';
import { faqRoute } from '../modules/faq/faq.route';
import { policyRoute } from '../modules/policy/policy.route';
import { settingsRoutes } from '../modules/settings/settings.route';
import { serviceBookingRoute } from '../modules/serviceBooking/serviceBooking.route';
import { instantConsultancyRoute } from '../modules/instantConsultancy/instantConsultancy.route';
import { bkashRoute } from '../modules/bkash/bkash.route';
import { reportRoute } from '../modules/report/report.route';

export const router = Router();

const moduleRoutes = [
  {
    path: '/user',
    route: userRoute,
  },
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/availability',
    route: availabilityRoute,
  },
  {
    path: '/wallet',
    route: walletRoute,
  },
  {
    path: '/payment',
    route: paymentRoute,
  },
  {
    path: '/appointment',
    route: appointmentRoute,
  },
  {
    path: '/payout',
    route: payoutRoute,
  },
  {
    path: '/review',
    route: reviewRoute,
  },
  {
    path: '/lawyer-specialties',
    route: lawyerSpecialtiesRoute,
  },
  {
    path: '/category',
    route: categoryRoute,
  },
  {
    path: '/service',
    route: serviceRoute,
  },
  {
    path: '/notification',
    route: notificationRoute,
  },
  {
    path: '/broadcast',
    route: broadcastRoute,
  },
  {
    path: '/banner',
    route: bannerRoute,
  },
  {
    path: '/lawyer',
    route: lawyerRoute,
  },
  {
    path: '/client',
    route: clientRoute,
  },
  {
    path: '/stats',
    route: statsRoute,
  },
  {
    path: '/message',
    route: messageRoute
  },
  {
    path: '/conversation',
    route: conversationRoute
  },
  {
    path: '/blog',
    route: blogRoute
  },
  {
    path: '/agora',
    route: agoraRoute
  },
  {
    path: '/settings',
    route: settingsRoutes
  },
  {
    path: '/faq',
    route: faqRoute
  },
  {
    path: '/policy',
    route: policyRoute
  },
  {
    path: '/report',
    route: reportRoute
  },
  {
    path: '/service-booking',
    route: serviceBookingRoute
  },
  {
    path: '/bkash',
    route: bkashRoute
  },
  {
    path: '/instant-consultancy',
    route: instantConsultancyRoute
  }
];

moduleRoutes.forEach(route => {
  router.use(route.path, route.route);
});
