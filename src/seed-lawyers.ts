/**
 * Dummy Lawyer Seed Script
 * Run: npx ts-node src/seed-lawyers.ts
 *
 * Creates 5 fully-populated dummy lawyer accounts for testing.
 * Login flow: POST /api/v1/auth/login  { phone }
 *             POST /api/v1/auth/verify-otp { phone, otp: "0000" }  (OTP disabled)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const DB_URL = process.env.DB_URL as string;
if (!DB_URL) throw new Error('DB_URL missing in .env');

// ─── Inline schemas (avoid circular imports) ────────────────────────────────

const UserSchema = new mongoose.Schema({
  email: String,
  phoneNo: { value: String, isVerified: { type: Boolean, default: true } },
  password: String,
  profilePhoto: String,
  role: { type: String, default: 'LAWYER' },
  isVerified: { type: Boolean, default: true },
  isActive: { type: String, default: 'ACTIVE' },
  isDeleted: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: new Date() },
  lawyer: mongoose.Schema.Types.ObjectId,
  notifications: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  auths: { type: Array, default: [] },
  fcmTokens: { type: [String], default: [] },
}, { timestamps: true });

const WalletSchema = new mongoose.Schema({
  lawyerId: mongoose.Schema.Types.ObjectId,
  balance: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
}, { timestamps: true });

const AvailabilitySchema = new mongoose.Schema({
  lawyerId: mongoose.Schema.Types.ObjectId,
  bookingType: String,
  month: String,
  availableDates: Array,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const LawyerSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  profile_Details: Object,
  lawyerDetails: Object,
  contactInfo: Object,
  gender: String,
  quialification: String,
  designation: String,
  per_consultation_fee: { type: Number, default: 500 },
  educations: [String],
  walletId: mongoose.Schema.Types.ObjectId,
  availability: [mongoose.Schema.Types.ObjectId],
  work_experience: Array,
  specialties: [mongoose.Schema.Types.ObjectId],
  categories: [mongoose.Schema.Types.ObjectId],
  services: [mongoose.Schema.Types.ObjectId],
  reviews: [mongoose.Schema.Types.ObjectId],
  avarage_rating: { type: Number, default: 0 },
  favorite_count: { type: Number, default: 0 },
  chambers_Count: { type: Number, default: 0 },
  appointments_Count: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  isSpecial: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  withdrawals: [mongoose.Schema.Types.ObjectId],
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Wallet = mongoose.model('Wallet', WalletSchema);
const Availability = mongoose.model('Availability', AvailabilitySchema);
const LawyerProfile = mongoose.model('LawyerProfile', LawyerSchema);

// ─── Dummy Data ──────────────────────────────────────────────────────────────

const LAWYERS = [
  {
    phone: '+8801711000001',
    email: 'rahman.advocate@justicebangladesh.com',
    first_name: 'Abdur',
    last_name: 'Rahman',
    gender: 'MALE',
    designation: 'Senior Advocate',
    quialification: 'LLB, LLM (Dhaka University)',
    fee: 1500,
    district: 'Dhaka',
    police_station: 'Motijheel',
    street_address: '45, Purana Paltan, Dhaka-1000',
    national_Country: 'Bangladesh',
    paypal_Email: 'rahman.pay@gmail.com',
    bar_no: 'BAR-2005-0012',
    license_no: 'LIC-BD-2005-0012',
    yearsOfExperience: 18,
    chamber_name: 'Rahman & Associates',
    practice_area: 'Criminal Law, Civil Litigation',
    about_lawyer: 'Senior advocate with 18 years of experience in criminal and civil litigation. Handled 500+ cases in the Supreme Court of Bangladesh.',
    isSpecial: true,
    isPopular: true,
    rating: 4.8,
    appointments: 312,
    views: 1540,
    work_experience: [
      {
        title: 'Senior Advocate',
        designation: 'Rahman & Associates',
        specialized_type: 'Criminal Law',
        starting_date: '2010-01-01',
        end_date: '',
        about_lawyer: 'Leading criminal defense cases at Supreme Court level.',
      },
      {
        title: 'Junior Advocate',
        designation: 'Dhaka Bar Association',
        specialized_type: 'Civil Law',
        starting_date: '2005-06-01',
        end_date: '2009-12-31',
        about_lawyer: 'Started career handling civil disputes and property cases.',
      },
    ],
    educations: ['LLB - Dhaka University (2004)', 'LLM - Dhaka University (2006)'],
    bookingType: 'online',
  },
  {
    phone: '+8801722000002',
    email: 'fatema.barrister@justicebangladesh.com',
    first_name: 'Fatema',
    last_name: 'Khanam',
    gender: 'FEMALE',
    designation: 'Barrister-at-Law',
    quialification: 'LLB (BUET), Bar-at-Law (Lincoln\'s Inn, UK)',
    fee: 2500,
    district: 'Chittagong',
    police_station: 'Kotwali',
    street_address: '12, Agrabad C/A, Chittagong-4100',
    national_Country: 'Bangladesh',
    paypal_Email: 'fatema.khanam@paypal.com',
    bar_no: 'BAR-2012-0087',
    license_no: 'LIC-BD-2012-0087',
    yearsOfExperience: 12,
    chamber_name: 'Khanam Legal Chambers',
    practice_area: 'Family Law, Divorce, Child Custody',
    about_lawyer: 'Barrister specializing in family law and women\'s rights. Passionate about protecting the rights of women and children in Bangladesh.',
    isSpecial: true,
    isPopular: false,
    rating: 4.6,
    appointments: 198,
    views: 980,
    work_experience: [
      {
        title: 'Barrister',
        designation: 'Khanam Legal Chambers',
        specialized_type: 'Family Law',
        starting_date: '2013-03-01',
        end_date: '',
        about_lawyer: 'Handling divorce, child custody, and domestic violence cases.',
      },
    ],
    educations: ['LLB - BUET (2011)', 'Bar-at-Law - Lincoln\'s Inn, UK (2012)'],
    bookingType: 'In Persona',
  },
  {
    phone: '+8801833000003',
    email: 'karim.corporate@justicebangladesh.com',
    first_name: 'Karim',
    last_name: 'Hossain',
    gender: 'MALE',
    designation: 'Corporate Lawyer',
    quialification: 'LLB, MBA (IBA)',
    fee: 3000,
    district: 'Dhaka',
    police_station: 'Gulshan',
    street_address: '88, Gulshan Avenue, Dhaka-1212',
    national_Country: 'Bangladesh',
    paypal_Email: 'karim.hossain.legal@gmail.com',
    bar_no: 'BAR-2008-0234',
    license_no: 'LIC-BD-2008-0234',
    yearsOfExperience: 15,
    chamber_name: 'Hossain Corporate Law Firm',
    practice_area: 'Corporate Law, Mergers & Acquisitions, Contract Law',
    about_lawyer: 'Expert in corporate law with extensive experience in M&A transactions, joint ventures, and commercial contracts for multinational companies operating in Bangladesh.',
    isSpecial: false,
    isPopular: true,
    rating: 4.9,
    appointments: 445,
    views: 2100,
    work_experience: [
      {
        title: 'Managing Partner',
        designation: 'Hossain Corporate Law Firm',
        specialized_type: 'Corporate Law',
        starting_date: '2015-01-01',
        end_date: '',
        about_lawyer: 'Managing corporate legal affairs for 50+ companies.',
      },
      {
        title: 'Associate',
        designation: 'BRAC Legal Division',
        specialized_type: 'Contract Law',
        starting_date: '2008-07-01',
        end_date: '2014-12-31',
        about_lawyer: 'Drafted and reviewed commercial contracts.',
      },
    ],
    educations: ['LLB - Dhaka University (2007)', 'MBA - IBA, Dhaka University (2009)'],
    bookingType: 'online',
  },
  {
    phone: '+8801944000004',
    email: 'nasrin.property@justicebangladesh.com',
    first_name: 'Nasrin',
    last_name: 'Akter',
    gender: 'FEMALE',
    designation: 'Property Law Specialist',
    quialification: 'LLB (Rajshahi University)',
    fee: 1200,
    district: 'Rajshahi',
    police_station: 'Boalia',
    street_address: '23, Shaheb Bazar, Rajshahi-6000',
    national_Country: 'Bangladesh',
    paypal_Email: 'nasrin.akter.law@gmail.com',
    bar_no: 'BAR-2015-0456',
    license_no: 'LIC-BD-2015-0456',
    yearsOfExperience: 8,
    chamber_name: 'Akter Property Law Office',
    practice_area: 'Property Law, Land Disputes, Real Estate',
    about_lawyer: 'Specialist in property and land dispute cases in Rajshahi division. Helped 200+ clients resolve land ownership conflicts.',
    isSpecial: false,
    isPopular: false,
    rating: 4.3,
    appointments: 156,
    views: 620,
    work_experience: [
      {
        title: 'Property Lawyer',
        designation: 'Akter Property Law Office',
        specialized_type: 'Property Law',
        starting_date: '2016-01-01',
        end_date: '',
        about_lawyer: 'Handling land registration, mutation, and dispute cases.',
      },
    ],
    educations: ['LLB - Rajshahi University (2014)'],
    bookingType: 'In Persona',
  },
  {
    phone: '+8801555000005',
    email: 'ibrahim.tax@justicebangladesh.com',
    first_name: 'Ibrahim',
    last_name: 'Chowdhury',
    gender: 'MALE',
    designation: 'Tax & Financial Lawyer',
    quialification: 'LLB, CA (ICAB)',
    fee: 2000,
    district: 'Sylhet',
    police_station: 'Kotwali',
    street_address: '7, Zindabazar, Sylhet-3100',
    national_Country: 'Bangladesh',
    paypal_Email: 'ibrahim.chowdhury.tax@gmail.com',
    bar_no: 'BAR-2010-0678',
    license_no: 'LIC-BD-2010-0678',
    yearsOfExperience: 13,
    chamber_name: 'Chowdhury Tax & Legal',
    practice_area: 'Tax Law, Financial Disputes, Banking Law',
    about_lawyer: 'Dual qualified as a lawyer and chartered accountant. Specializes in tax disputes, VAT cases, and banking litigation in Sylhet region.',
    isSpecial: true,
    isPopular: true,
    rating: 4.7,
    appointments: 267,
    views: 1320,
    work_experience: [
      {
        title: 'Tax Lawyer',
        designation: 'Chowdhury Tax & Legal',
        specialized_type: 'Tax Law',
        starting_date: '2012-01-01',
        end_date: '',
        about_lawyer: 'Representing clients in NBR tax disputes and VAT tribunal.',
      },
      {
        title: 'Chartered Accountant',
        designation: 'KPMG Bangladesh',
        specialized_type: 'Financial Law',
        starting_date: '2010-06-01',
        end_date: '2011-12-31',
        about_lawyer: 'Audit and financial compliance work.',
      },
    ],
    educations: ['LLB - Sylhet Law College (2009)', 'CA - ICAB (2011)'],
    bookingType: 'online',
  },
];

// ─── Seed Function ───────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(DB_URL);
  console.log('✅ Connected to MongoDB');

  let created = 0;
  let skipped = 0;

  for (const data of LAWYERS) {
    // Skip if phone already exists
    const existing = await User.findOne({ 'phoneNo.value': data.phone });
    if (existing) {
      console.log(`⏭  Skipped (already exists): ${data.phone}`);
      skipped++;
      continue;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Create User
      const [user] = await User.create([{
        email: data.email,
        phoneNo: { value: data.phone, isVerified: true },
        role: 'LAWYER',
        isVerified: true,
        isActive: 'ACTIVE',
        isDeleted: false,
        isOnline: false,
        notifications: [],
        auths: [],
        fcmTokens: [],
      }], { session });

      // 2. Create LawyerProfile (partial — no walletId yet)
      const [profile] = await LawyerProfile.create([{
        userId: user._id,
        profile_Details: {
          fast_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          national_Country: data.national_Country,
          paypal_Email: data.paypal_Email,
          street_address: data.street_address,
          district: data.district,
          police_station: data.police_station,
        },
        lawyerDetails: {
          bar_no: data.bar_no,
          license_no: data.license_no,
          yearsOfExperience: data.yearsOfExperience,
          chamber_name: data.chamber_name,
          practice_area: data.practice_area,
          bar_council_certificate: '',
          about_lawyer: data.about_lawyer,
        },
        contactInfo: {
          contactNumber: data.phone,
          lawyerNumber: data.phone,
          address: data.street_address,
          currentWorkingPlace: data.chamber_name,
          location: data.district,
        },
        gender: data.gender,
        quialification: data.quialification,
        designation: data.designation,
        per_consultation_fee: data.fee,
        educations: data.educations,
        work_experience: data.work_experience,
        avarage_rating: data.rating,
        appointments_Count: data.appointments,
        views: data.views,
        isSpecial: data.isSpecial,
        isPopular: data.isPopular,
        isOnline: false,
      }], { session });

      // 3. Create Wallet
      const [wallet] = await Wallet.create([{ lawyerId: profile._id, balance: 0 }], { session });

      // 4. Create Availability (current month, 3 days, 4 slots each)
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const slots = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];
      const availableDates = [1, 3, 5].map((offset) => {
        const d = new Date(now);
        d.setDate(d.getDate() + offset);
        return {
          date: d,
          schedules: slots.map((time) => ({ time, isBooked: false, status: 'available' })),
        };
      });

      const [avail] = await Availability.create([{
        lawyerId: profile._id,
        bookingType: data.bookingType,
        month: monthStr,
        availableDates,
        isActive: true,
      }], { session });

      // 5. Update LawyerProfile with walletId + availability
      await LawyerProfile.findByIdAndUpdate(
        profile._id,
        { walletId: wallet._id, availability: [avail._id] },
        { session }
      );

      // 6. Link lawyer to user
      await User.findByIdAndUpdate(user._id, { lawyer: profile._id }, { session });

      await session.commitTransaction();
      session.endSession();

      console.log(`✅ Created: ${data.first_name} ${data.last_name} | Phone: ${data.phone}`);
      created++;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error(`❌ Failed: ${data.phone}`, err);
    }
  }

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Created : ${created}`);
  console.log(`⏭  Skipped : ${skipped}`);
  console.log('─────────────────────────────────────');
  console.log('\n📋 Test Login Credentials:');
  console.log('─────────────────────────────────────');
  LAWYERS.forEach((l) => {
    console.log(`👤 ${l.first_name} ${l.last_name}`);
    console.log(`   Phone : ${l.phone}`);
    console.log(`   Email : ${l.email}`);
    console.log(`   Fee   : ৳${l.fee}`);
    console.log('');
  });
  console.log('Login: POST /api/v1/auth/login       { "phone": "<number>" }');
  console.log('OTP  : POST /api/v1/auth/verify-otp  { "phone": "<number>" }  (OTP disabled — any value works)');

  await mongoose.disconnect();
  console.log('\n✅ Done. MongoDB disconnected.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
