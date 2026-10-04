import { describe, it, expect } from 'vitest'
import { api, createUser } from './helpers'
import User from '../models/User'

const DAY = 24 * 60 * 60 * 1000

const localDate = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)

// timestamps make createdAt immutable through the model, so fixtures set it on the raw collection.
async function setCreatedAt(email: string, date: Date) {
  await User.collection.updateOne({ email: email.toLowerCase() }, { $set: { createdAt: date } })
}

describe('GET /api/auth/stats — user growth', () => {
  it('counts sign-ups per local day, plus everyone who joined before the window', async () => {
    const admin = await createUser({ role: 'admin' })
    const early = await createUser()
    await setCreatedAt(early.email, new Date(Date.now() - 90 * DAY))
    // 22:30 UTC is already the next calendar day in Istanbul (UTC+3).
    const lateEvening = new Date(Date.now() - 2 * DAY)
    lateEvening.setUTCHours(22, 30, 0, 0)
    const late = await createUser()
    await setCreatedAt(late.email, lateEvening)

    const res = await api.get('/api/auth/stats?tz=Europe/Istanbul').set('Authorization', `Bearer ${admin.token}`)

    expect(res.status).toBe(200)
    const growth = res.body.data.userGrowth
    expect(growth.timezone).toBe('Europe/Istanbul')
    expect(growth.totalBefore).toBe(1)
    const istanbulDay = localDate(lateEvening, 'Europe/Istanbul')
    expect(istanbulDay).not.toBe(lateEvening.toISOString().slice(0, 10))
    expect(growth.daily.find((d: { date: string }) => d.date === istanbulDay)?.count).toBe(1)
    const counted = growth.totalBefore + growth.daily.reduce((sum: number, d: { count: number }) => sum + d.count, 0)
    expect(counted).toBe(await User.countDocuments())
  })

  it('falls back to UTC for a time zone it does not know', async () => {
    const admin = await createUser({ role: 'admin' })
    const res = await api.get('/api/auth/stats?tz=Not%2FA_Zone').set('Authorization', `Bearer ${admin.token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.userGrowth.timezone).toBe('UTC')
  })

  it('is still admin-only', async () => {
    const member = await createUser()
    const res = await api.get('/api/auth/stats').set('Authorization', `Bearer ${member.token}`)
    expect(res.status).toBe(403)
  })
})
