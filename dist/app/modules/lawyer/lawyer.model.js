"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LawyerProfileModel = void 0;
const mongoose_1 = require("mongoose");
const lawyer_interface_1 = require("./lawyer.interface");
const ProfileDetailsSchema = new mongoose_1.Schema({
    fast_name: { type: String },
    last_name: { type: String },
    email: { type: String },
    phone: { type: String },
    paypal_Email: { type: String },
    street_address: { type: String },
    district: { type: String },
    national_Country: { type: String },
    police_station: { type: String },
}, { _id: false });
const LawyerDetailsSchema = new mongoose_1.Schema({
    bar_no: { type: String },
    license_no: { type: String },
    yearsOfExperience: { type: Number },
    chamber_name: { type: String },
    practice_area: { type: String },
    court_districts: [{ district: { type: String }, court: { type: String }, _id: false }],
    bar_council_certificate: { type: String },
    about_lawyer: { type: String },
}, { _id: false });
const ContactInfoSchema = new mongoose_1.Schema({
    contactNumber: { type: String },
    lawyerNumber: { type: String },
    address: { type: String },
    currentWorkingPlace: { type: String },
    location: { type: String },
}, { _id: false });
const WorkExperienceSchema = new mongoose_1.Schema({
    title: { type: String },
    designation: { type: String },
    specialized_type: { type: String },
    starting_date: { type: String },
    end_date: { type: String },
    about_lawyer: { type: String },
}, { _id: false });
const ChamberSchema = new mongoose_1.Schema({
    name: { type: String },
    location: { type: String },
}, { _id: false });
const PayoutMethodSchema = new mongoose_1.Schema({
    type: { type: String, enum: ['Bank', 'bKash', 'Nagad'], default: 'bKash' },
    bankName: { type: String },
    branchName: { type: String },
    accountNumber: { type: String },
    accountHolderName: { type: String },
    bkashNumber: { type: String },
    nagadNumber: { type: String },
}, { _id: false });
const QualificationSchema = new mongoose_1.Schema({
    degree: { type: String },
    institution: { type: String },
    year: { type: String },
}, { _id: false });
// ===== Main Schema =====
const LawyerProfileSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    profile_Details: { type: ProfileDetailsSchema },
    lawyerDetails: { type: LawyerDetailsSchema },
    contactInfo: { type: ContactInfoSchema },
    gender: { type: String, enum: Object.values(lawyer_interface_1.EGender) },
    quialification: { type: String },
    designation: { type: String },
    per_consultation_fee: { type: Number, default: 500 },
    educations: { type: [String] },
    qualifications: [{ type: QualificationSchema }],
    walletId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Wallet' },
    availability: [{ type: mongoose_1.Types.ObjectId, ref: 'Availability' }],
    work_experience: [{ type: WorkExperienceSchema }],
    specialties: [{ type: mongoose_1.Types.ObjectId, ref: 'LawyerSpecialty' }],
    categories: [{ type: mongoose_1.Types.ObjectId, ref: 'Category' }],
    services: [{ type: mongoose_1.Types.ObjectId, ref: 'Service' }],
    reviews: [{ type: mongoose_1.Types.ObjectId, ref: 'ClientReview' }],
    avarage_rating: { type: Number, default: 0 },
    favorite_count: { type: Number, default: 0 },
    chambers: [{ type: ChamberSchema }],
    chambers_Count: { type: Number, default: 0 },
    appointments_Count: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    isSpecial: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    inPerson: { type: Boolean, default: false },
    videoConsult: { type: Boolean, default: false },
    audioCall: { type: Boolean, default: false },
    call_fees: [{ minutes: { type: Number }, fee: { type: Number }, _id: false }],
    video_fees: [{ minutes: { type: Number }, fee: { type: Number }, _id: false }],
    chamber_fee: { type: Number, default: 0 },
    chamber_duration: { type: Number, default: 15 },
    payoutMethod: { type: PayoutMethodSchema, default: null },
    withdrawals: [{ type: mongoose_1.Types.ObjectId, ref: 'Withdrawal' }],
}, { timestamps: true });
// ===== Model =====
exports.LawyerProfileModel = (0, mongoose_1.model)('LawyerProfile', LawyerProfileSchema);
