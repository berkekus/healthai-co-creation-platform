import { z } from 'zod'
import type { TFunction } from 'i18next'
import { MAX_POST_DOMAINS } from '../constants/domains'

// Kept for a future institutional-only rollout. The backend uses the matching
// REQUIRE_INSTITUTIONAL_EMAIL environment variable.
const REQUIRE_INSTITUTIONAL_EMAIL = import.meta.env.VITE_REQUIRE_INSTITUTIONAL_EMAIL === 'true'
const INSTITUTIONAL_EMAIL_RE = /\.(edu|gov)(\.[a-z]{2,})?$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// The check digit is verified by the API; this catches typos in the shape early.
const ORCID_INPUT_RE = /^(https?:\/\/(www\.)?orcid\.org\/)?\d{4}-\d{4}-\d{4}-\d{3}[\dXx]$/

function webAddress(value: string): URL | null {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}

/** An optional text field: empty means "not provided", anything else must pass `valid`. */
function optionalDetail(valid: (value: string) => boolean, message: string) {
  return z.string().optional().refine(value => !value?.trim() || valid(value.trim()), { message })
}

export function createPostCreateSchema(t: TFunction) {
  return z.object({
    title:             z.string().min(5, t('validators.post.titleMin')),
    domains:           z.array(z.string().min(1))
                         .min(1, t('validators.post.domainRequired'))
                         .max(MAX_POST_DOMAINS, t('validators.post.domainsMax', { max: MAX_POST_DOMAINS })),
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
    firstName:   z.string().min(2, t('validators.profile.firstNameMin')),
    lastName:    z.string().min(2, t('validators.profile.lastNameMin')),
    institution: z.string().min(2, t('validators.profile.institutionRequired')),
    city:        z.string().min(1, t('validators.cityRequired')),
    country:     z.string().min(1, t('validators.countryRequired')),
    bio:         z.string().max(400, t('validators.profile.bioMax')).optional(),
    position:    z.string().max(100, t('validators.profile.detailTooLong')).optional(),
    department:  z.string().max(120, t('validators.profile.detailTooLong')).optional(),
    orcid:       optionalDetail(value => ORCID_INPUT_RE.test(value), t('validators.profile.orcidInvalid')),
    institutionWebsite: optionalDetail(value => webAddress(value) !== null, t('validators.profile.websiteInvalid')),
    contactEmail: optionalDetail(value => EMAIL_RE.test(value), t('validators.profile.contactEmailInvalid')),
    linkedinUrl: optionalDetail(value => {
      const host = webAddress(value)?.hostname.toLowerCase() ?? ''
      return host === 'linkedin.com' || host.endsWith('.linkedin.com')
    }, t('validators.profile.linkedinInvalid')),
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
  const email = z.string().min(1, t('validators.emailRequired')).email(t('validators.emailInvalid'))
  const registerEmail = REQUIRE_INSTITUTIONAL_EMAIL
    ? email.refine(value => INSTITUTIONAL_EMAIL_RE.test(value), { message: t('validators.register.institutionalOnly') })
    : email

  return z.object({
    firstName:   z.string().min(2, t('validators.register.firstNameMin')),
    lastName:    z.string().min(2, t('validators.register.lastNameMin')),
    email:       registerEmail,
    password:    z.string().min(8, t('validators.register.passwordMin8')),
    confirm:     z.string().min(1, t('validators.register.confirmRequired')),
    role:        z.enum(['engineer', 'healthcare_professional']).refine(v => !!v, { message: t('validators.register.roleRequired') }),
    institution: z.string().min(2, t('validators.register.institutionRequired')),
    city:        z.string().min(1, t('validators.cityRequired')),
    country:     z.string().min(1, t('validators.countryRequired')),
  }).refine(d => d.password === d.confirm, {
    message: t('validators.register.passwordMismatch'),
    path: ['confirm'],
    // Zod skips object-level refinements while any field is invalid, and on the
    // first step the role and institution fields are still empty — so without
    // this the mismatch was never reported and people moved on with it.
    when: payload => {
      const value = payload.value as { password?: unknown; confirm?: unknown } | undefined
      return typeof value?.password === 'string' && typeof value?.confirm === 'string'
    },
  })
}

export type LoginFormData    = z.infer<ReturnType<typeof createLoginSchema>>
export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>
