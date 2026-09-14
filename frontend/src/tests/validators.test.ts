import { describe, it, expect } from 'vitest'
import i18n from '../i18n'
import { createRegisterSchema, createLoginSchema, createPostCreateSchema, createProfileSchema } from '../utils/validators'

// Schemas are built from the real i18n instance (defaults to English in this
// test environment — no locale/navigator is set), so the message-content
// assertions below keep checking the same English strings as before.
const registerSchema = createRegisterSchema(i18n.t)
const loginSchema = createLoginSchema(i18n.t)
const postCreateSchema = createPostCreateSchema(i18n.t)
const profileSchema = createProfileSchema(i18n.t)

// ─── registerSchema ─────────────────────────────────────────────────────────

describe('registerSchema', () => {
  const valid = {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@university.edu',
    password: 'password123',
    confirm: 'password123',
    role: 'engineer' as const,
    institution: 'Test University',
    city: 'Istanbul',
    country: 'Turkey',
  }

  it('accepts valid data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts a personal email while the institutional-only flag is disabled', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'alice@gmail.com' })
    expect(result.success).toBe(true)
  })

  it.each([
    'alice@agency.gov',
    'alice@nhs.gov.uk',
    'alice@bogazici.edu.tr',
    'ALICE@UNIVERSITY.EDU',
  ])('accepts institutional email %s', (email) => {
    expect(registerSchema.safeParse({ ...valid, email }).success).toBe(true)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'short', confirm: 'short' })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({ ...valid, confirm: 'different123' })
    expect(result.success).toBe(false)
    expect(JSON.stringify(result)).toContain('Passwords do not match')
  })

  it('flags mismatched passwords on the account step, while role and institution are still empty', () => {
    const accountStepOnly = {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@university.edu',
      password: 'password123',
      confirm: 'different123',
    }
    const result = registerSchema.safeParse(accountStepOnly)
    const confirmIssues = result.error?.issues.filter(issue => issue.path[0] === 'confirm') ?? []
    expect(confirmIssues.map(issue => issue.message)).toContain('Passwords do not match')
  })

  it('rejects first name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...valid, firstName: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    expect(registerSchema.safeParse({}).success).toBe(false)
  })
})

// ─── loginSchema ────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'user@test.edu', password: 'pass123' }).success).toBe(true)
  })

  it('rejects invalid email format', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'pass123' }).success).toBe(false)
  })

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'user@test.edu', password: '' }).success).toBe(false)
  })
})

// ─── postCreateSchema ────────────────────────────────────────────────────────

describe('postCreateSchema', () => {
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const valid = {
    title: 'AI-assisted cardiac diagnosis',
    domains: ['Cardiology'],
    expertiseRequired: 'Machine Learning',
    description: 'A detailed description that is at least fifty characters long for the test.',
    projectStage: 'idea' as const,
    collaborationType: 'research_partner' as const,
    levelOfCommitment: 'flexible' as const,
    confidentiality: 'public_pitch' as const,
    city: 'Istanbul',
    country: 'Turkey',
    expiryDate: futureDate,
  }

  it('accepts valid post data', () => {
    expect(postCreateSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects title shorter than 5 characters', () => {
    expect(postCreateSchema.safeParse({ ...valid, title: 'AI' }).success).toBe(false)
  })

  it('accepts an idea that spans up to three domains', () => {
    expect(postCreateSchema.safeParse({ ...valid, domains: ['Midwifery', 'Nursing', 'Maternal & Newborn Health'] }).success).toBe(true)
  })

  it('rejects a post without any domain', () => {
    expect(postCreateSchema.safeParse({ ...valid, domains: [] }).success).toBe(false)
  })

  it('rejects a post with more than three domains', () => {
    const result = postCreateSchema.safeParse({ ...valid, domains: ['Cardiology', 'Oncology', 'Neurology', 'Nursing'] })
    expect(result.success).toBe(false)
  })

  it('rejects description shorter than 50 characters', () => {
    expect(postCreateSchema.safeParse({ ...valid, description: 'Too short' }).success).toBe(false)
  })

  it('rejects expiry date in the past', () => {
    const past = new Date(Date.now() - 1000).toISOString()
    const result = postCreateSchema.safeParse({ ...valid, expiryDate: past })
    expect(result.success).toBe(false)
    expect(JSON.stringify(result)).toContain('future')
  })

  it('rejects invalid collaborationType enum value', () => {
    expect(postCreateSchema.safeParse({ ...valid, collaborationType: 'research' }).success).toBe(false)
  })

  it('rejects invalid levelOfCommitment enum value', () => {
    expect(postCreateSchema.safeParse({ ...valid, levelOfCommitment: 'weekly' }).success).toBe(false)
  })

  it('rejects invalid confidentiality enum value', () => {
    expect(postCreateSchema.safeParse({ ...valid, confidentiality: 'public' }).success).toBe(false)
  })
})

// ─── profileSchema ───────────────────────────────────────────────────────────

describe('profileSchema', () => {
  const valid = {
    firstName: 'Alice',
    lastName: 'Smith',
    institution: 'Test University',
    city: 'Istanbul',
    country: 'Turkey',
  }

  it('accepts valid profile data', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts optional bio within limit', () => {
    expect(profileSchema.safeParse({ ...valid, bio: 'Short bio.' }).success).toBe(true)
  })

  it('rejects bio longer than 400 characters', () => {
    const longBio = 'a'.repeat(401)
    expect(profileSchema.safeParse({ ...valid, bio: longBio }).success).toBe(false)
  })

  it('rejects first name shorter than 2 characters', () => {
    expect(profileSchema.safeParse({ ...valid, firstName: 'A' }).success).toBe(false)
  })

  it('accepts professional details', () => {
    const result = profileSchema.safeParse({
      ...valid,
      position: 'Midwife researcher',
      department: 'Faculty of Health Sciences',
      orcid: 'https://orcid.org/0000-0002-1825-0097',
      institutionWebsite: 'https://www.ul.pt',
      contactEmail: 'office@ul.pt',
      linkedinUrl: 'https://www.linkedin.com/in/someone',
    })
    expect(result.success).toBe(true)
  })

  it('treats empty professional details as not provided', () => {
    const result = profileSchema.safeParse({ ...valid, orcid: '', institutionWebsite: '', contactEmail: '', linkedinUrl: '' })
    expect(result.success).toBe(true)
  })

  it.each([
    ['a malformed ORCID iD', { orcid: '1234-5678' }],
    ['a LinkedIn link to another site', { linkedinUrl: 'https://example.com/in/someone' }],
    ['a website without http(s)', { institutionWebsite: 'ul.pt' }],
    ['a malformed contact email', { contactEmail: 'office-at-ul.pt' }],
  ])('rejects %s', (_label, details) => {
    expect(profileSchema.safeParse({ ...valid, ...details }).success).toBe(false)
  })
})
