import { z } from 'zod'
import type { TFunction } from 'i18next'

export function createPostCreateSchema(t: TFunction) {
  return z.object({
    title:             z.string().min(5, t('validators.post.titleMin')),
    domain:            z.string().min(1, t('validators.post.domainRequired')),
    expertiseRequired: z.string().min(3, t('validators.post.expertiseMin')),
    description:       z.string().min(50, t('validators.post.descriptionMin')),
    projectStage:      z.enum(['idea', 'concept_validation', 'prototype', 'pilot', 'pre_deployment'] as const),
    collaborationType: z.enum(['advisor', 'co_founder', 'research_partner', 'contract'] as const),
    levelOfCommitment: z.enum(['flexible', 'low', 'medium', 'high'] as const),
    confidentiality:   z.enum(['public_pitch', 'meeting_only'] as const),
    city:              z.string().min(1, t('validators.cityRequired')),
    country:           z.string().min(1, t('validators.countryRequired')),
    expiryDate:        z.string().min(1, t('validators.post.expiryRequired')).refine(
      v => new Date(v) > new Date(),
      { message: t('validators.post.expiryFuture') }
    ),
  })
}

export type PostCreateFormData = z.infer<ReturnType<typeof createPostCreateSchema>>

export function createProfileSchema(t: TFunction) {
  return z.object({
    name:        z.string().min(2, t('validators.profile.nameMin')),
    institution: z.string().min(2, t('validators.profile.institutionRequired')),
    city:        z.string().min(1, t('validators.cityRequired')),
    country:     z.string().min(1, t('validators.countryRequired')),
    bio:         z.string().max(400, t('validators.profile.bioMax')).optional(),
  })
}

export type ProfileFormData = z.infer<ReturnType<typeof createProfileSchema>>

export function createLoginSchema(t: TFunction) {
  return z.object({
    email:    z.string().min(1, t('validators.emailRequired')).email(t('validators.emailInvalid')),
    password: z.string().min(1, t('validators.passwordRequired')),
  })
}

export function createRegisterSchema(t: TFunction) {
  return z.object({
    name:        z.string().min(2, t('validators.register.nameMin')),
    email:       z
      .string()
      .min(1, t('validators.emailRequired'))
      .email(t('validators.emailInvalid'))
      .refine(v => /\.edu(\.[a-z]{2,})?$/.test(v), {
        message: t('validators.register.eduOnly'),
      }),
    password:    z.string().min(8, t('validators.register.passwordMin8')),
    confirm:     z.string().min(1, t('validators.register.confirmRequired')),
    role:        z.enum(['engineer', 'healthcare_professional']).refine(v => !!v, { message: t('validators.register.roleRequired') }),
    institution: z.string().min(2, t('validators.register.institutionRequired')),
    city:        z.string().min(1, t('validators.cityRequired')),
    country:     z.string().min(1, t('validators.countryRequired')),
  }).refine(d => d.password === d.confirm, {
    message: t('validators.register.passwordMismatch'),
    path: ['confirm'],
  })
}

export type LoginFormData    = z.infer<ReturnType<typeof createLoginSchema>>
export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>
