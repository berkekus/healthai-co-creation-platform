import bcrypt from 'bcryptjs'
import User from '../models/User'
import { deleteUserByAdmin } from './authService'

/**
 * Finds and removes accounts whose password is the demo password used by the seed
 * scripts. That password is in this public repository (seed scripts, the dev login
 * buttons), so any such account in production can be signed into by anyone, and the
 * seeded profiles use real institutions' domains.
 *
 * Dry run by default: lists the accounts. With --apply each one is deleted the way an
 * admin deletion does it (posts, meetings and messages included; people who had a
 * meeting with them are told it was cancelled). Admin accounts are listed, never deleted.
 */
export const DEMO_PASSWORD = 'HealthAI2026!'

export async function findDemoAccounts() {
  const users = await User.find({}).select('+password email name role createdAt')
  const matches = []
  for (const user of users) {
    if (user.password && await bcrypt.compare(DEMO_PASSWORD, user.password)) matches.push(user)
  }
  return matches
}

export async function removeDemoAccounts(apply: boolean) {
  const accounts = await findDemoAccounts()
  const report = { found: accounts.length, deleted: [] as string[], skippedAdmins: [] as string[] }
  for (const account of accounts) {
    if (account.role === 'admin') { report.skippedAdmins.push(account.email); continue }
    if (apply) {
      await deleteUserByAdmin(account.id as string)
      report.deleted.push(account.email)
    }
  }
  return { accounts, report }
}
