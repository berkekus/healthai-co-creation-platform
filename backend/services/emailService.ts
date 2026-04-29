import nodemailer, { Transporter } from 'nodemailer'

let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  if (!host) return null

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
  return transporter
}

const FROM = process.env.SMTP_FROM ?? '"HEALTH AI" <noreply@healthai.local>'
const APP_URL = process.env.APP_BASE_URL ?? process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

async function send(to: string, subject: string, html: string): Promise<void> {
  const t = getTransporter()
  if (!t) {
    // Dev mode fallback: log the email content so the link is still visible
    console.log('\n[EMAIL — SMTP not configured, logging instead]')
    console.log(`  To:      ${to}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Body:\n${html}\n`)
    return
  }
  await t.sendMail({ from: FROM, to, subject, html })
}

export async function sendVerificationEmail(to: string, token: string, name: string): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #36213E;">Welcome to HEALTH AI, ${name}!</h1>
      <p>Click the button below to verify your account. This link will expire in 24 hours.</p>
      <p style="margin: 32px 0;">
        <a href="${verifyUrl}" style="background: #36213E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Verify my email
        </a>
      </p>
      <p style="color: #666; font-size: 13px;">If the button does not work, copy this link into your browser:</p>
      <p style="word-break: break-all; color: #36213E; font-size: 13px;"><a href="${verifyUrl}">${verifyUrl}</a></p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
      <p style="color: #999; font-size: 12px;">If you did not register on HEALTH AI, please ignore this email.</p>
    </div>
  `
  await send(to, 'Verify your HEALTH AI account', html)
}

export async function sendAccountDeletedEmail(to: string, name: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #36213E;">Account deleted</h1>
      <p>Hi ${name},</p>
      <p>Your HEALTH AI account and personal data have been permanently deleted, as requested under GDPR Article 17 (Right to erasure).</p>
      <p>Audit logs related to your account are retained for 24 months as required by our security policy.</p>
      <p style="color: #999; font-size: 12px; margin-top: 32px;">— The HEALTH AI team</p>
    </div>
  `
  await send(to, 'Your HEALTH AI account has been deleted', html)
}
