"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLawyerSchema = void 0;
const zod_1 = require("zod");
// Profile Details Schema
const profileDetailsSchema = zod_1.z.object({
    fast_name: zod_1.z.string().min(1, 'First name is required').optional(),
    last_name: zod_1.z.string().min(1, 'Last name is required').optional(),
    email: zod_1.z.string().email('Invalid email format').optional(),
    phone: zod_1.z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    paypal_Email: zod_1.z.string().email('Invalid PayPal email format').optional(),
    street_address: zod_1.z.string().optional(),
    district: zod_1.z.string().optional(),
    national_Country: zod_1.z.string().optional(),
    police_station: zod_1.z.string().optional(),
}).optional();
// Lawyer Details Schema
const lawyerDetailsSchema = zod_1.z.object({
    bar_no: zod_1.z.string().optional(),
    license_no: zod_1.z.string().optional(),
    yearsOfExperience: zod_1.z.number().min(0, 'Years of experience cannot be negative').optional(),
    chamber_name: zod_1.z.string().optional(),
    practice_area: zod_1.z.string().optional(),
    bar_council_certificate: zod_1.z.string().optional(),
    about_lawyer: zod_1.z.string().max(1000, 'About lawyer must be less than 1000 characters').optional(),
}).optional();
// Contact Info Schema
const contactInfoSchema = zod_1.z.object({
    contactNumber: zod_1.z.string().optional(),
    lawyerNumber: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    currentWorkingPlace: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
}).optional();
// Work Experience Schema
const workExperienceSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').optional(),
    designation: zod_1.z.string().optional(),
    specialized_type: zod_1.z.string().optional(),
    starting_date: zod_1.z.string().optional(),
    end_date: zod_1.z.string().optional(),
    about_lawyer: zod_1.z.string().optional(),
});
// Main Update Lawyer Schema
exports.updateLawyerSchema = zod_1.z.object({
    profile_Details: profileDetailsSchema,
    lawyerDetails: lawyerDetailsSchema,
    contactInfo: contactInfoSchema,
    gender: zod_1.z.enum(['MALE', 'FEMALE']).optional(),
    quialification: zod_1.z.string().optional(),
    designation: zod_1.z.string().optional(),
    per_consultation_fee: zod_1.z.union([
        zod_1.z.number().min(0, 'Consultation fee cannot be negative'),
        zod_1.z.string().transform((val) => parseFloat(val))
    ]).optional(),
    educations: zod_1.z.array(zod_1.z.string()).optional(),
    work_experience: zod_1.z.array(workExperienceSchema).optional(),
    isSpecial: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string().transform((val) => val === 'true')]).optional(),
    isPopular: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string().transform((val) => val === 'true')]).optional(),
    isOnline: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string().transform((val) => val === 'true')]).optional(),
    inPerson: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string().transform((val) => val === 'true')]).optional(),
    videoConsult: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string().transform((val) => val === 'true')]).optional(),
    audioCall: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string().transform((val) => val === 'true')]).optional(),
    chambers_Count: zod_1.z.number().optional(),
    chambers: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
    })).optional(),
    qualifications: zod_1.z.array(zod_1.z.object({
        degree: zod_1.z.string().optional(),
        institution: zod_1.z.string().optional(),
        year: zod_1.z.string().optional(),
    })).optional(),
    services: zod_1.z.array(zod_1.z.string()).optional(),
    categories: zod_1.z.array(zod_1.z.string()).optional(),
}).partial();
