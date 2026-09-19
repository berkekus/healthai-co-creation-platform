/**
 * Cloudflare Turnstile site key, or null when none is configured.
 *
 * Vite inlines this at build time, so a missing variable reaches the browser as
 * `undefined` rather than failing the build. The widget then never mounts, no
 * token is ever produced, and any button gated on that token stays disabled
 * with nothing on screen to explain why — which is how a single unset variable
 * once locked every visitor out of both signing in and signing up.
 *
 * Treat the captcha as a gate only when there is a captcha. The API applies the
 * same rule from its side: verifyTurnstile passes when no secret is set.
 */
const raw = import.meta.env.VITE_TURNSTILE_SITE_KEY

export const TURNSTILE_SITE_KEY: string | null =
  typeof raw === 'string' && raw.trim().length > 0 ? raw : null

export const captchaConfigured = TURNSTILE_SITE_KEY !== null

/**
 * Whether a form still needs a captcha token before it may be submitted.
 * False when no key is configured, so the form stays usable.
 */
export function captchaBlocks(token: string | null): boolean {
  return captchaConfigured && !token
}
