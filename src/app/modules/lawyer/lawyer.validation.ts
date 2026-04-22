import { z } from 'zod';

// Profile Details Schema
const profileDetailsSchema = z.object({
  fast_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  paypal_Email: z.string().email('Invalid PayPal email format').optional(),
  street_address: z.string().optional(),
  district: z.string().optional(),
  national_Country: z.string().optional(),
  police_station: z.string().optional(),
}).optional();

// Lawyer Details Schema
const lawyerDetailsSchema = z.object({
  bar_no: z.string().optional(),
  license_no: z.string().optional(),
  yearsOfExperience: z.number().min(0, 'Years of experience cannot be negative').optional(),
  chamber_name: z.string().optional(),
  practice_area: z.string().optional(),
  bar_council_certificate: z.string().optional(),
  about_lawyer: z.string().max(1000, 'About lawyer must be less than 1000 characters').optional(),
}).optional();

// Contact Info Schema
const contactInfoSchema = z.object({
  contactNumber: z.string().optional(),
  lawyerNumber: z.string().optional(),
  address: z.string().optional(),
  currentWorkingPlace: z.string().optional(),
  location: z.string().optional(),
}).optional();

// Work Experience Schema
const workExperienceSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  designation: z.string().optional(),
  specialized_type: z.string().optional(),
  starting_date: z.string().optional(),
  end_date: z.string().optional(),
  about_lawyer: z.string().optional(),
});

// Main Update Lawyer Schema
export const updateLawyerSchema = z.object({
  profile_Details: profileDetailsSchema,
  lawyerDetails: lawyerDetailsSchema,
  contactInfo: contactInfoSchema,
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  quialification: z.string().optional(),

  designation: z.string().optional(),
  per_consultation_fee: z.union([
    z.number().min(0, 'Consultation fee cannot be negative'),
    z.string().transform((val) => parseFloat(val))
  ]).optional(),
  educations: z.array(z.string()).optional(),
  work_experience: z.array(workExperienceSchema).optional(),
  isSpecial: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
  isPopular: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
  isOnline: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
  inPerson: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
  videoConsult: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
  audioCall: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
  chambers_Count: z.number().optional(),
  chambers: z.array(z.object({
    name: z.string().optional(),
    location: z.string().optional(),
  })).optional(),
  qualifications: z.array(z.object({
    degree: z.string().optional(),
    institution: z.string().optional(),
    year: z.string().optional(),
  })).optional(),
  services: z.array(z.string()).optional(),
  categories:  z.array(z.string()).optional(),
  call_fees: z.array(z.object({
    minutes: z.number().optional(),
    fee: z.number().optional(),
  })).optional(),
  video_fees: z.array(z.object({
    minutes: z.number().optional(),
    fee: z.number().optional(),
  })).optional(),
  chamber_fee: z.union([z.number(), z.string().transform(v => parseInt(v) || 0)]).optional(),
  chamber_duration: z.union([z.number(), z.string().transform(v => parseInt(v) || 15)]).optional(),
  extension_pricing: z.object({
    enabled: z.union([z.boolean(), z.string().transform(v => v === 'true')]).optional(),
    per_minute_rate: z.union([z.number(), z.string().transform(v => parseInt(v) || 0)]).optional(),
    audio_per_minute_rate: z.union([z.number(), z.string().transform(v => parseInt(v) || 0)]).optional(),
    video_per_minute_rate: z.union([z.number(), z.string().transform(v => parseInt(v) || 0)]).optional(),
    chamber_per_minute_rate: z.union([z.number(), z.string().transform(v => parseInt(v) || 0)]).optional(),
    max_extension_minutes: z.union([z.number(), z.string().transform(v => parseInt(v) || 30)]).optional(),
    description: z.string().optional(),
  }).optional(),
  payoutMethod: z.object({
    type: z.enum(['Bank', 'bKash', 'Nagad']),
    bankName: z.string().optional(),
    branchName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolderName: z.string().optional(),
    bkashNumber: z.string().optional(),
    nagadNumber: z.string().optional(),
  }).optional(),
}).partial();

// Type export
export type UpdateLawyerInput = z.infer<typeof updateLawyerSchema>;

