import passport from 'passport'
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2'
import { Strategy as LinkedInStrategy, Profile as LinkedInProfile } from 'passport-linkedin-oauth2'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import User from '../models/User'

// OAuth callback'leri BACKEND'in public URL'ine gelir. APP_BASE_URL (frontend, e-posta
// linkleri için) ile karışmaması adına önce API_BASE_URL okunur.
const APP_BASE = process.env.API_BASE_URL ?? process.env.APP_BASE_URL ?? 'http://localhost:5000'

// OAuth kullanıcıları şifreyle giriş yapamaz; alan yine de bcrypt hash'i olarak saklanır
// (düz metin / tahmin edilebilir değer asla yazılmaz).
async function unusablePassword(): Promise<string> {
  return bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12)
}

export function initPassport(): void {
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${APP_BASE}/api/auth/github/callback`,
        scope: ['user:email'],
      },
      async (_accessToken: string, _refreshToken: string, profile: GitHubProfile, done: (err: Error | null, user?: unknown) => void) => {
        try {
          const email = (profile.emails?.[0]?.value ?? '').toLowerCase()
          let user = await User.findOne({ $or: [{ githubId: profile.id }, ...(email ? [{ email }] : [])] })

          if (user) {
            if (!user.githubId) {
              user.githubId = profile.id
              user.githubUsername = profile.username ?? undefined
              await user.save()
            }
          } else {
            if (!email) return done(null, false)
            user = await User.create({
              name: profile.displayName || profile.username || 'GitHub User',
              email,
              password: await unusablePassword(),
              role: 'engineer',
              institution: '',
              city: '',
              country: '',
              githubId: profile.id,
              githubUsername: profile.username ?? undefined,
              isVerified: true,
            })
          }
          return done(null, user)
        } catch (err) {
          return done(err as Error)
        }
      }
    ))
  }

  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    passport.use(new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: `${APP_BASE}/api/auth/linkedin/callback`,
        scope: ['r_emailaddress', 'r_liteprofile'],
      },
      async (_accessToken: string, _refreshToken: string, profile: LinkedInProfile, done: (err: Error | null, user?: unknown) => void) => {
        try {
          const email = (profile.emails?.[0]?.value ?? '').toLowerCase()
          let user = await User.findOne({ $or: [{ linkedinId: profile.id }, ...(email ? [{ email }] : [])] })

          if (user) {
            if (!user.linkedinId) {
              user.linkedinId = profile.id
              user.linkedinProfileUrl = `https://www.linkedin.com/in/${profile.id}`
              await user.save()
            }
          } else {
            if (!email) return done(null, false)
            user = await User.create({
              name: profile.displayName || 'LinkedIn User',
              email,
              password: await unusablePassword(),
              role: 'healthcare_professional',
              institution: '',
              city: '',
              country: '',
              linkedinId: profile.id,
              linkedinProfileUrl: `https://www.linkedin.com/in/${profile.id}`,
              isVerified: true,
            })
          }
          return done(null, user)
        } catch (err) {
          return done(err as Error)
        }
      }
    ))
  }
}

export function makeOAuthToken(userId: string): string {
  return jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions)
}
