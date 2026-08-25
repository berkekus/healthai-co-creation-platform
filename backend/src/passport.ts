import passport from 'passport'
import { Strategy as GitHubStrategy } from 'passport-github2'
import { Strategy as OAuth2Strategy } from 'passport-oauth2'
import jwt from 'jsonwebtoken'
import type { Request } from 'express'
import User from '../models/User'

/**
 * OAuth here is *account linking only* — never sign-up and never sign-in.
 *
 * Registration is gated on institutional .edu / .gov addresses. If a provider
 * callback were allowed to create accounts, anyone with a GitHub account on a
 * personal address could mint a verified user and walk straight past that gate.
 * So the callbacks below can only attach a provider identity to an account that
 * already exists and is already signed in.
 */

/**
 * The provider redirects back to THIS server, so the callback is built from the
 * API's own public origin. APP_BASE_URL is deliberately not reused: that one is
 * the front-end origin, because it is what verification emails link to.
 */
const SERVER_BASE = (process.env.SERVER_BASE_URL ?? `http://localhost:${process.env.PORT ?? 5000}`)
  .replace(/\/+$/, '')

export type OAuthProvider = 'github' | 'linkedin'

/** Why a link attempt was refused — surfaced to the profile page as a query param. */
export type LinkFailure = 'no_session' | 'already_linked' | 'user_gone'

const LINK_TOKEN_TTL = '10m'

/**
 * A short-lived, signed token naming the account that started the flow. It rides
 * through the provider as the OAuth `state` parameter and comes back untouched,
 * which is what lets the callback know *who* is linking — the callback request
 * carries no session and no Authorization header.
 *
 * Being signed and short-lived, it doubles as the flow's CSRF protection.
 */
export function makeLinkToken(userId: string, provider: OAuthProvider): string {
  return jwt.sign(
    { uid: userId, provider, purpose: 'oauth-link' },
    process.env.JWT_SECRET as string,
    { expiresIn: LINK_TOKEN_TTL } as jwt.SignOptions,
  )
}

function readLinkToken(state: unknown, provider: OAuthProvider): string | null {
  if (typeof state !== 'string' || state.length === 0) return null
  try {
    const payload = jwt.verify(state, process.env.JWT_SECRET as string) as {
      uid?: string; provider?: string; purpose?: string
    }
    // A token minted for GitHub must not be replayable against LinkedIn.
    if (payload.purpose !== 'oauth-link') return null
    if (payload.provider !== provider) return null
    return payload.uid ?? null
  } catch {
    return null
  }
}

type VerifyDone = (err: Error | null, user?: Express.User | false, info?: { code: LinkFailure }) => void

/**
 * Attaches a provider identity to the account named by the state token.
 *
 * Uses an update rather than load-then-save so the write touches only these two
 * fields: an existing document would otherwise be re-validated with `password`
 * unselected and `institution`/`city`/`country` untouched, which is exactly the
 * kind of incidental failure that is hard to see coming.
 */
async function linkProvider(
  provider: OAuthProvider,
  req: Request,
  providerId: string,
  fields: Record<string, unknown>,
  done: VerifyDone,
): Promise<void> {
  try {
    const userId = readLinkToken(req.query.state, provider)
    if (!userId) return done(null, false, { code: 'no_session' })

    const idField = provider === 'github' ? 'githubId' : 'linkedinId'

    // One provider identity may not be shared across two HealthAI accounts.
    const taken = await User.findOne({ [idField]: providerId }).select('_id').lean()
    if (taken && String(taken._id) !== userId) {
      return done(null, false, { code: 'already_linked' })
    }

    const user = await User.findByIdAndUpdate(userId, { $set: fields }, { new: true })
    if (!user) return done(null, false, { code: 'user_gone' })

    return done(null, user as unknown as Express.User)
  } catch (err) {
    return done(err as Error)
  }
}

export function initPassport(): void {
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${SERVER_BASE}/api/auth/github/callback`,
        // No scope requested: the public profile already carries the id and
        // login name, and we no longer read the user's email address.
        passReqToCallback: true,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((req: Request, _accessToken: string, _refreshToken: string, profile: any, done: VerifyDone) =>
        void linkProvider('github', req, String(profile.id), {
          githubId: String(profile.id),
          githubUsername: profile.username ?? undefined,
        }, done)) as never,
    ))
  }

  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    // LinkedIn retired r_liteprofile / r_emailaddress and the /v2/me endpoint
    // that passport-linkedin-oauth2 calls, so that strategy cannot authenticate
    // against a modern LinkedIn app. This is the OpenID Connect flow it replaced.
    const linkedin = new OAuth2Strategy(
      {
        authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: `${SERVER_BASE}/api/auth/linkedin/callback`,
        scope: ['openid', 'profile'],
        passReqToCallback: true,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((req: Request, _accessToken: string, _refreshToken: string, profile: any, done: VerifyDone) =>
        void linkProvider('linkedin', req, String(profile.id), {
          linkedinId: String(profile.id),
        }, done)) as never,
    )

    // OIDC exposes the profile at /v2/userinfo; `sub` is the stable member id.
    // Note it carries no vanity URL, so linkedinProfileUrl stays unset rather
    // than being filled with a /in/<id> link, which never resolved anyway.
    linkedin.userProfile = function (accessToken: string, done: (err?: Error | null, profile?: unknown) => void) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(this as any)._oauth2.get(
        'https://api.linkedin.com/v2/userinfo',
        accessToken,
        (err: unknown, body: string | Buffer | undefined) => {
          if (err) return done(err as Error)
          try {
            const raw = JSON.parse(String(body)) as { sub?: string; name?: string }
            if (!raw.sub) return done(new Error('LinkedIn userinfo returned no subject'))
            return done(null, { id: raw.sub, displayName: raw.name ?? '' })
          } catch (parseErr) {
            return done(parseErr as Error)
          }
        },
      )
    }

    passport.use('linkedin', linkedin)
  }
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  return provider === 'github'
    ? Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
    : Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET)
}

/** Where the provider should send the browser to begin a link. */
export function providerStartUrl(provider: OAuthProvider, linkToken: string): string {
  return `${SERVER_BASE}/api/auth/${provider}?state=${encodeURIComponent(linkToken)}`
}
