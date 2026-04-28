import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, postCreateSchema, profileSchema } from '../utils/validators'

// ─── registerSchema ─────────────────────────────────────────────────────────

describe('registerSchema', () => {
  const valid = {
    name: 'Alice Smith',
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

  it('rejects non-.edu email', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'alice@gmail.com' })
    expect(result.success).toBe(false)
    expect(JSON.stringify(result)).toContain('.edu')
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

  it('rejects name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...valid, name: 'A' })
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
    domain: 'cardiology',
    expertiseRequired: 'Machine Learning',
    description: 'A detailed description that is at least fifty characters long for the test.',
    projectStage: 'idea' as const,
    collaborationType: 'research_partner' as const,
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

  it('rejects invalid confidentiality enum value', () => {
    expect(postCreateSchema.safeParse({ ...valid, confidentiality: 'public' }).success).toBe(false)
  })
})

// ─── profileSchema ───────────────────────────────────────────────────────────

describe('profileSchema', () => {
  const valid = {
    name: 'Alice Smith',
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

  it('rejects name shorter than 2 characters', () => {
    expect(profileSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false)
  })
})
