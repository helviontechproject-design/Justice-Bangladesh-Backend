import { z } from 'zod';
import { EIsActive, ERole } from './user.interface';

const objectIdString = () =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid ObjectId string' });


const phoneNoSchema = z.object({
  value: z.string().min(6, 'phone number too short').max(20),
  isVerified: z.boolean(),
});

const authProviderSchema = z.object({
  provider: z.string().min(1),
  providerId: z.string().min(1),
});


export const createUserSchema = z.object({
  email: z.string().email(),
  phoneNo: phoneNoSchema.optional(),
  password: z.string().min(6).optional(),
  profilePhoto: z.string().url().optional(),
  date_of_birth: z.string().optional(),
  isActive: z.nativeEnum(EIsActive).optional(),
  client: objectIdString().optional(),
  lawyer: objectIdString().optional(),
  role: z.nativeEnum(ERole).optional(),
  isDeleted: z.boolean().optional(),
  notifications: z.array(objectIdString()).optional(),
  auths: z.array(authProviderSchema).optional(),
});


export const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    phoneNo: phoneNoSchema.optional(),
    password: z.string().min(6).optional(), 
    profilePhoto: z.string().url().optional(),
    date_of_birth: z.string().optional(),
    isActive: z.nativeEnum(EIsActive).optional(),
    client: objectIdString().optional(),
    lawyer: objectIdString().optional(),
    role: z.nativeEnum(ERole).optional(),
    isDeleted: z.boolean().optional(),
    notifications: z.array(objectIdString()).optional(),
    auths: z.array(authProviderSchema).optional(),
  })
  .strict();

// types
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
