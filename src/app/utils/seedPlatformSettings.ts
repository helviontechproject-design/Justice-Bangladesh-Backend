import { PlatformSettings } from '../modules/settings/settings.model';

export const seedPlatformSettings = async () => {
  try {
    const settingsExist = await PlatformSettings.findOne();

    if (settingsExist) {
      console.log('Platform settings already exist!');
      return;
    }

    const defaultSettings = {
      platformFee: {
        percentage: 15,
        type: 'PERCENTAGE' as const,
        enabled: true,
      },

      payout: {
        minimumAmount: 1000,
        processingDays: 7,
        maxPendingPayouts: 5,
      },

      payment: {
        currency: 'BDT',
        taxPercentage: 0,
        gateway: 'SSLCOMMERZ' as const,
      },

      general: {
        platformName: 'lawfirm',
        supportEmail: 'support@lawfirm.com',
        supportPhone: '+8801791732611',
        maintenanceMode: false,
        allowNewGuideRegistrations: true,
      },

      socialLinks: {
        facebook: 'https://facebook.com/lawfirm',
        twitter: 'https://twitter.com/lawfirm',
        instagram: 'https://instagram.com/lawfirm',
        linkedin: 'https://linkedin.com/company/lawfirm',
        youtube: 'https://youtube.com/@lawfirm',
      },

      contacts: {
        address: 'Dhaka, Bangladesh',
        phone: '+8801791732611',
        email: 'contact@lawfirm.com',
        supportEmail: 'support@lawfirm.com',
        supportPhone: '+8801791732611',
        businessHours: 'Saturday - Thursday: 9:00 AM - 6:00 PM',
      },

      seo: {
        metaTitle: 'lawfirm - Find Your Perfect Lawyer',
        metaDescription:
          'Connect with experienced Lawyers and get expert legal advice. Hire the best legal professionals for your needs.',
        metaKeywords:
          'lawfirm, lawyer, legal advice, hire lawyer, legal services, attorney, law consultant',
      },
    };

    await PlatformSettings.create(defaultSettings);
    console.log('Platform settings seeded successfully!');
  } catch (error) {
    console.log('Error seeding platform settings:', error);
  }
};
