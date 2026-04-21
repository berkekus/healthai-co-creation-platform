import { z } from 'zod'

export const postCreateSchema = z.object({
  title:             z.string().min(5, 'Title must be at least 5 characters'),
  domain:            z.string().min(1, 'Please select a medical domain'),
  expertiseRequired: z.string().min(3, 'Describe the expertise required'),
  description:       z.string().min(50, 'Description must be at least 50 characters'),
  projectStage:      z.enum(['idea', 'concept_validation', 'prototype', 'pilot', 'pre_deployment'] as const),
  collaborationType: z.enum(['advisor', 'co_founder', 'research_partner', 'contract'] as const),
  confidentiality:   z.enum(['public_pitch', 'meeting_only'] as const),
  city:              z.string().min(1, 'City is required'),
  country:           z.string().min(1, 'Country is required'),
  expiryDate:        z.string().min(1, 'Expiry date is required').refine(
    v => new Date(v) > new Date(),
    { message: 'Expiry date must be in the future' }
  ),
})

export type PostCreateFormData = z.infer<typeof postCreateSchema>

export const profileSchema = z.object({
  name:        z.string().min(2, 'Name must be at least 2 characters'),
  institution: z.string().min(2, 'Institution is required'),
  city:        z.string().min(1, 'City is required'),
  country:     z.string().min(1, 'Country is required'),
  bio:         z.string().max(400, 'Bio must be under 400 characters').optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>

export const loginSchema = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name:        z.string().min(2, 'Full name must be at least 2 characters'),
  email:       z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .refine(v => v.endsWith('.edu'), {
      message: 'Only institutional .edu email addresses are accepted. Personal email providers are not permitted.',
    }),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  confirm:     z.string().min(1, 'Please confirm your password'),
  role:        z.enum(['engineer', 'healthcare_professional']).refine(v => !!v, { message: 'Please select a role' }),
  institution: z.string().min(2, 'Institution name is required'),
  city:        z.string().min(1, 'City is required'),
  country:     z.string().min(1, 'Country is required'),
}).refine(d => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})

export type LoginFormData    = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
