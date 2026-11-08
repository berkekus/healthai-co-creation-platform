import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import { removeDemoAccounts } from '../services/demoAccounts'

/**
 * Lists (dry run) or deletes (--apply) accounts that use the public demo password.
 * See services/demoAccounts.ts for why.
 *
 *   npm run remove:demo-accounts             # list
 *   npm run remove:demo-accounts -- --apply  # delete
 */
async function main() {
  const apply = process.argv.includes('--apply')
  await mongoose.connect(process.env.MONGO_URI as string)
  console.log(apply ? 'APPLY mode — matching accounts will be deleted' : 'DRY RUN — pass --apply to delete')

  const { accounts, report } = await removeDemoAccounts(apply)
  for (const account of accounts) {
    console.log(`${account.role === 'admin' ? '[admin, kept] ' : ''}${account.email}  (${account.name}, created ${account.createdAt.toISOString().slice(0, 10)})`)
  }
  console.log(`\n${report.found} account(s) use the demo password.`)
  if (apply) console.log(`${report.deleted.length} deleted.`)
  if (report.skippedAdmins.length) {
    console.log(`${report.skippedAdmins.length} admin account(s) kept: change their password by hand.`)
  }
  await mongoose.disconnect()
}

main().catch(err => { console.error(err); process.exit(1) })
