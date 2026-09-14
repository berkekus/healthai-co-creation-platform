import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { api, createPost, createUser, futureDate, uniqueEmail } from './helpers'
import User from '../models/User'
import Meeting from '../models/Meeting'
import Post from '../models/Post'
import Notification from '../models/Notification'

describe('POST /api/auth/register', () => {
  it('returns 201 with user; requiresVerification true; no token issued', async () => {
    const email = uniqueEmail()
    const res = await api.post('/api/auth/register').send({
      name: 'Alice',
      email,
      password: 'password123',
      role: 'engineer',
      institution: 'Test Uni',
      city: 'Istanbul',
      country: 'Turkey',
    })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeUndefined()
    expect(res.body.data.requiresVerification).toBe(true)
    expect(res.body.data.user.isVerified).toBe(false)
  })

  it('re-sends a fresh verification link when an unverified email registers again, without changing its password', async () => {
    const email = uniqueEmail()
    const registration = {
      name: 'First Try',
      email,
      password: 'originalPass1',
      role: 'engineer',
      institution: 'Test Uni',
      city: 'Istanbul',
      country: 'Turkey',
    }
    const first = await api.post('/api/auth/register').send(registration)
    expect(first.status).toBe(201)
    const before = await User.findOne({ email: email.toLowerCase() }).select('verifyToken name')

    const again = await api.post('/api/auth/register').send({
      ...registration,
      name: 'Second Try',
      password: 'attackerPass2',
    })
    expect(again.status).toBe(200)
    expect(again.body.data.requiresVerification).toBe(true)
    expect(again.body.data.pendingVerification).toBe(true)
    expect(again.body.data.token).toBeUndefined()

    const after = await User.findOne({ email: email.toLowerCase() }).select('verifyToken name')
    expect(after?.verifyToken).toBeTruthy()
    expect(after?.verifyToken).not.toBe(before?.verifyToken)
    expect(after?.name).toBe('First Try')

    await User.updateOne({ email: email.toLowerCase() }, { $set: { isVerified: true } })
    expect((await api.post('/api/auth/login').send({ email, password: 'attackerPass2' })).status).toBe(401)
    expect((await api.post('/api/auth/login').send({ email, password: 'originalPass1' })).status).toBe(200)
  })

  it('returns 409 on duplicate email', async () => {
    const { email } = await createUser()
    const res = await api.post('/api/auth/register').send({
      name: 'Duplicate',
      email,
      password: 'password123',
      role: 'engineer',
      institution: 'Test Uni',
      city: 'Istanbul',
      country: 'Turkey',
    })
    expect(res.status).toBe(409)
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await api.post('/api/auth/register').send({ email: uniqueEmail() })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is shorter than 8 chars', async () => {
    const res = await api.post('/api/auth/register').send({
      name: 'Bob',
      email: uniqueEmail(),
      password: 'short',
      role: 'engineer',
      institution: 'Uni',
      city: 'Istanbul',
      country: 'Turkey',
    })
    expect(res.status).toBe(400)
  })

  it('does not allow a public registration to choose the admin role', async () => {
    const res = await api.post('/api/auth/register').send({
      name: 'Attempted Admin',
      email: uniqueEmail(),
      password: 'password123',
      role: 'admin',
      institution: 'Test Uni',
      city: 'Istanbul',
      country: 'Turkey',
    })
    expect(res.status).toBe(400)
  })

  const registerWith = (email: string) => api.post('/api/auth/register').send({
    name: 'Institutional User',
    email,
    password: 'password123',
    role: 'engineer',
    institution: 'Test Uni',
    city: 'Istanbul',
    country: 'Turkey',
  })

  it.each(['gov', 'gov.uk', 'edu', 'edu.tr'])(
    'accepts an institutional .%s address',
    async (suffix) => {
      const res = await registerWith(`inst-${Date.now()}-${suffix.replace('.', '')}@agency.${suffix}`)
      expect(res.status).toBe(201)
    },
  )

  it('accepts a personal email provider while the institutional-only flag is disabled', async () => {
    const res = await registerWith(`personal-${Date.now()}@gmail.com`)
    expect(res.status).toBe(201)
  })
})

describe('POST /api/auth/login', () => {
  it('returns 200 with token on valid credentials', async () => {
    const { email, password } = await createUser()
    const res = await api.post('/api/auth/login').send({ email, password })
    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeTruthy()
  })

  it('returns 401 on wrong password', async () => {
    const { email } = await createUser()
    const res = await api.post('/api/auth/login').send({ email, password: 'wrongpassword' })
    expect(res.status).toBe(401)
  })

  it('returns 401 on unknown email', async () => {
    const res = await api.post('/api/auth/login').send({ email: uniqueEmail(), password: 'password123' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns 200 with user when authenticated', async () => {
    const { token, user } = await createUser()
    const res = await api.get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe(user.email)
  })

  it('returns 401 without token', async () => {
    const res = await api.get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/auth/me/password', () => {
  it('returns 200 when old password is correct', async () => {
    const { token, password } = await createUser()
    const res = await api
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: password, newPassword: 'newpassword456' })
    expect(res.status).toBe(200)
  })

  it('returns 400 when old password is wrong', async () => {
    const { token } = await createUser()
    const res = await api
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'wrongoldpassword', newPassword: 'newpassword456' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when new password is too short', async () => {
    const { token, password } = await createUser()
    const res = await api
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: password, newPassword: 'short' })
    expect(res.status).toBe(400)
  })

  it('invalidates the previous session after a password change', async () => {
    const { token, password, email } = await createUser()
    const change = await api
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: password, newPassword: 'newpassword456' })
    expect(change.status).toBe(200)

    const previousSession = await api.get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(previousSession.status).toBe(401)

    const login = await api.post('/api/auth/login').send({ email, password: 'newpassword456' })
    expect(login.status).toBe(200)
    const newSession = await api.get('/api/auth/me').set('Authorization', `Bearer ${login.body.data.token}`)
    expect(newSession.status).toBe(200)
  })
})

describe('POST /api/auth/login (unverified)', () => {
  it('returns 403 when account email is not verified', async () => {
    const email = uniqueEmail()
    const password = 'password123'
    await api.post('/api/auth/register').send({
      name: 'Unverified',
      email,
      password,
      role: 'engineer',
      institution: 'Uni',
      city: 'Istanbul',
      country: 'Turkey',
    })
    // Skip verification flag flip — try to login while still unverified
    const res = await api.post('/api/auth/login').send({ email, password })
    expect(res.status).toBe(403)
  })
})

describe('POST /api/auth/verify-email', () => {
  it('verifies the user with a valid token and returns a JWT', async () => {
    const email = uniqueEmail()
    await api.post('/api/auth/register').send({
      name: 'Verifier',
      email,
      password: 'password123',
      role: 'engineer',
      institution: 'Uni',
      city: 'Istanbul',
      country: 'Turkey',
    })

    // DB stores SHA256(rawToken); inject a known raw token so the test can send it
    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { verifyToken: hashedToken, verifyTokenExpires: new Date(Date.now() + 86400_000) }
    )

    const res = await api.post('/api/auth/verify-email').send({ token: rawToken })
    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeTruthy()
    expect(res.body.data.user.isVerified).toBe(true)
  })

  it('returns 400 on invalid token', async () => {
    const res = await api.post('/api/auth/verify-email').send({ token: 'definitely-not-real' })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/auth/me', () => {
  it('deletes the account when password is correct', async () => {
    const { token, password, email } = await createUser()
    const res = await api
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ password })
    expect(res.status).toBe(200)

    const gone = await User.findOne({ email: email.toLowerCase() })
    expect(gone).toBeNull()
  })

  it('deletes owned data and safely anonymizes an active meeting', async () => {
    const account = await createUser()
    const owner = await createUser({ role: 'healthcare_professional' })
    const ownerPost = await createPost(owner.token)
    const ownedPost = await createPost(account.token)

    await api
      .post(`/api/posts/${ownerPost.id}/publish`)
      .set('Authorization', `Bearer ${owner.token}`)

    const meetingRes = await api
      .post('/api/meetings')
      .set('Authorization', `Bearer ${account.token}`)
      .send({
        postId: ownerPost.id,
        message: 'I am interested in collaborating on this health AI project.',
        ndaAccepted: true,
        proposedSlots: [
          { date: futureDate(2), time: '10:00' },
          { date: futureDate(3), time: '11:00' },
          { date: futureDate(4), time: '14:00' },
        ],
      })
    expect(meetingRes.status).toBe(201)

    const res = await api
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${account.token}`)
      .send({ password: account.password })
    expect(res.status).toBe(200)

    expect(await User.exists({ email: account.email.toLowerCase() })).toBeNull()
    expect(await Post.findById(ownedPost.id)).toBeNull()

    const retainedMeeting = await Meeting.findById(meetingRes.body.data.id)
    expect(retainedMeeting?.status).toBe('cancelled')
    expect(retainedMeeting?.requesterName).toBe('Deleted user')
    expect(retainedMeeting?.requesterEmail).toBe('')
  })

  it('tells the other participant about the cancellation in a translatable form', async () => {
    const account = await createUser()
    const owner = await createUser({ role: 'healthcare_professional' })
    const ownerPost = await createPost(owner.token, { title: 'Sepsis early warning' })
    await api.post(`/api/posts/${ownerPost.id}/publish`).set('Authorization', `Bearer ${owner.token}`)
    await api
      .post('/api/meetings')
      .set('Authorization', `Bearer ${account.token}`)
      .send({
        postId: ownerPost.id,
        message: 'I am interested in collaborating on this health AI project.',
        ndaAccepted: true,
        proposedSlots: [{ date: futureDate(2), time: '10:00' }],
      })
    await Notification.deleteMany({})

    const res = await api
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${account.token}`)
      .send({ password: account.password })
    expect(res.status).toBe(200)

    const notice = await Notification.findOne({ userId: owner.user.id, type: 'meeting_cancelled' })
    expect(notice?.contentKey).toBe('meeting_cancelled_account_deleted')
    expect(notice?.metadata).toMatchObject({ postTitle: 'Sepsis early warning' })
  })

  it('returns 400 with wrong password and keeps the account', async () => {
    const { token, email } = await createUser()
    const res = await api
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'wrongpassword' })
    expect(res.status).toBe(400)
    expect(await User.exists({ email: email.toLowerCase() })).not.toBeNull()
  })

  it('returns 400 when password is missing', async () => {
    const { token } = await createUser()
    const res = await api
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/forgot-password + reset-password', () => {
  it('silently succeeds for unknown email', async () => {
    const res = await api.post('/api/auth/forgot-password').send({ email: 'nobody@nowhere.com' })
    expect(res.status).toBe(200)
  })

  it('resets password with a valid token', async () => {
    const { email, password } = await createUser()

    // Trigger forgot-password (silently sends email)
    await api.post('/api/auth/forgot-password').send({ email })

    // Inject a known raw token directly into DB (same pattern as verifyEmail test)
    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { resetToken: hashedToken, resetTokenExpires: new Date(Date.now() + 3_600_000) }
    )

    const newPassword = 'NewPassword99!'
    const resetRes = await api.post('/api/auth/reset-password').send({ token: rawToken, newPassword })
    expect(resetRes.status).toBe(200)

    // Old password no longer works
    const oldLoginRes = await api.post('/api/auth/login').send({ email, password })
    expect(oldLoginRes.status).toBe(401)

    // New password works
    const newLoginRes = await api.post('/api/auth/login').send({ email, password: newPassword })
    expect(newLoginRes.status).toBe(200)
  })

  it('lets an unverified account reset its password, which also verifies the email', async () => {
    const email = uniqueEmail()
    await api.post('/api/auth/register').send({
      name: 'Forgetful',
      email,
      password: 'forgotten123',
      role: 'engineer',
      institution: 'Uni',
      city: 'Istanbul',
      country: 'Turkey',
    })

    const forgotRes = await api.post('/api/auth/forgot-password').send({ email })
    expect(forgotRes.status).toBe(200)
    const pending = await User.findOne({ email: email.toLowerCase() }).select('resetToken')
    expect(pending?.resetToken).toBeTruthy()

    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { resetToken: hashedToken, resetTokenExpires: new Date(Date.now() + 3_600_000) }
    )

    const resetRes = await api.post('/api/auth/reset-password').send({ token: rawToken, newPassword: 'Remembered99!' })
    expect(resetRes.status).toBe(200)

    const loginRes = await api.post('/api/auth/login').send({ email, password: 'Remembered99!' })
    expect(loginRes.status).toBe(200)
    expect(loginRes.body.data.user.isVerified).toBe(true)
  })

  it('returns 400 on invalid reset token', async () => {
    const res = await api.post('/api/auth/reset-password').send({ token: 'fakefake', newPassword: 'NewPass123!' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when new password is too short', async () => {
    const res = await api.post('/api/auth/reset-password').send({ token: 'sometoken', newPassword: 'short' })
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/auth/me/profile — professional details', () => {
  const updateProfile = (token: string, body: Record<string, unknown>) =>
    api.put('/api/auth/me/profile').set('Authorization', `Bearer ${token}`).send(body)

  it('saves professional details and shows them on the public profile', async () => {
    const member = await createUser()
    const visitor = await createUser()

    const res = await updateProfile(member.token, {
      position: 'Associate Professor',
      department: 'Department of Midwifery',
      orcid: 'https://orcid.org/0000-0002-1825-0097',
      institutionWebsite: 'https://www.ul.pt',
      contactEmail: 'research.office@ul.pt',
      linkedinUrl: 'https://www.linkedin.com/in/example-midwife',
    })
    expect(res.status).toBe(200)

    const publicProfile = await api
      .get(`/api/auth/users/${member.user.id}`)
      .set('Authorization', `Bearer ${visitor.token}`)
    expect(publicProfile.body.data).toMatchObject({
      position: 'Associate Professor',
      department: 'Department of Midwifery',
      orcid: '0000-0002-1825-0097',
      institutionWebsite: 'https://www.ul.pt',
      contactEmail: 'research.office@ul.pt',
      linkedinUrl: 'https://www.linkedin.com/in/example-midwife',
    })
  })

  it.each([
    ['an ORCID iD with a wrong check digit', { orcid: '0000-0002-1825-0098' }],
    ['a LinkedIn link to another site', { linkedinUrl: 'https://example.com/in/someone' }],
    ['a website that is not a web address', { institutionWebsite: 'javascript:alert(1)' }],
    ['a malformed contact email', { contactEmail: 'not-an-email' }],
  ])('rejects %s', async (_label, body) => {
    const member = await createUser()
    const res = await updateProfile(member.token, body)
    expect(res.status).toBe(400)
  })

  it('clears a professional detail that is sent empty', async () => {
    const member = await createUser()
    await updateProfile(member.token, { orcid: '0000-0001-5109-3700' })

    const res = await updateProfile(member.token, { orcid: '' })
    expect(res.status).toBe(200)
    const me = await api.get('/api/auth/me').set('Authorization', `Bearer ${member.token}`)
    expect(me.body.data.orcid).toBeUndefined()
  })
})

describe('OAuth account linking', () => {
  const withGithubConfigured = async (fn: () => Promise<void>) => {
    process.env.GITHUB_CLIENT_ID = 'test-client-id'
    process.env.GITHUB_CLIENT_SECRET = 'test-client-secret'
    try { await fn() } finally {
      delete process.env.GITHUB_CLIENT_ID
      delete process.env.GITHUB_CLIENT_SECRET
    }
  }

  it('requires authentication to start a link', async () => {
    const res = await api.get('/api/auth/github/link-url')
    expect(res.status).toBe(401)
  })

  it('lists which providers can be connected, so the profile can hide the rest', async () => {
    const unconfigured = await api.get('/api/auth/providers')
    expect(unconfigured.status).toBe(200)
    expect(unconfigured.body.data).toEqual({ github: false, linkedin: false })

    await withGithubConfigured(async () => {
      const configured = await api.get('/api/auth/providers')
      expect(configured.body.data).toEqual({ github: true, linkedin: false })
    })
  })

  it('reports the provider as unavailable when it has no credentials', async () => {
    const { token } = await createUser()
    const res = await api.get('/api/auth/github/link-url').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(503)
  })

  it('sends the browser back to the profile instead of erroring when unconfigured', async () => {
    const res = await api.get('/api/auth/github')
    expect(res.status).toBe(302)
    expect(res.headers.location).toContain('oauth_error=not_configured')
  })

  it('issues a start url whose state token names the caller and the provider', async () => {
    await withGithubConfigured(async () => {
      const { token, user } = await createUser()
      const res = await api.get('/api/auth/github/link-url').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)

      const url = new URL(res.body.data.url as string)
      expect(url.pathname).toBe('/api/auth/github')

      const state = url.searchParams.get('state')
      expect(state).toBeTruthy()

      const payload = jwt.verify(state as string, process.env.JWT_SECRET as string) as {
        uid: string; provider: string; purpose: string
      }
      expect(payload.purpose).toBe('oauth-link')
      expect(payload.provider).toBe('github')
      expect(payload.uid).toBe(user.id)
    })
  })

  it("shows a linked provider on the member's own account", async () => {
    const { token, user } = await createUser()
    await User.updateOne({ _id: user.id }, { $set: { githubId: '4242', githubUsername: 'octo-clinician' } })

    const me = await api.get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(me.body.data).toMatchObject({ githubId: '4242', githubUsername: 'octo-clinician' })
  })

  it('disconnects a linked provider', async () => {
    const { token, user } = await createUser()
    await User.findByIdAndUpdate(user.id, { $set: { githubId: 'gh-123', githubUsername: 'octocat' } })

    const res = await api.delete('/api/auth/github/link').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)

    const after = await User.findById(user.id).lean()
    expect(after?.githubId).toBeUndefined()
    expect(after?.githubUsername).toBeUndefined()
  })

  it('keeps the callback from minting an account when the state is missing', async () => {
    const before = await User.countDocuments()
    const res = await api.get('/api/auth/github/callback?code=irrelevant')
    // Unconfigured provider: passport has no strategy, so this must not 2xx.
    expect(res.status).not.toBe(200)
    expect(await User.countDocuments()).toBe(before)
  })
})
