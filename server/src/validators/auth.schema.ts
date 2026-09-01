import { z } from 'zod';

export const googleAuthSchema = z.object({
  token: z.string().min(1, 'Google ID token is required'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(80, 'Name is too long').optional(),
  avatar: z.string().max(20000, 'Avatar too large').optional(),
});