import dotenv from 'dotenv'
dotenv.config()

import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import { canonicalizeDomains } from '../constants/domains'

/**
 * One-off data fix for the domain list clean-up (merged duplicates such as
 * "Radiology" / "Radiology & Imaging"). Rewrites legacy domain names on posts,
 * saved-search filters and profile expertise tags, and gives every post a
 * `domains` list. Filters already understand the old names, so running this is
 * tidy-up, not a prerequisite.
 *
 * Dry run by default. Writes a JSON backup of every changed document before
 * mutating anything when --apply is passed.
 *
 *   npm run migrate:domains            # show what would change
 *   npm run migrate:domains -- --apply # write the changes
 */

const APPLY = process.argv.includes('--apply')

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((value, i) => value === b[i])

async function main() {
  await mongoose.connect(process.env.MONGO_URI as string)
  console.log('MongoDB connected —', APPLY ? 'APPLY mode' : 'DRY RUN (pass --apply to write changes)')

  const db = mongoose.connection
  const backup: Record<string, unknown[]> = { posts: [], savedsearches: [], users: [] }

  // Posts: canonical names, first one mirrored into the legacy `domain` field.
  for (const post of await db.collection('posts').find({}, { projection: { domain: 1, domains: 1 } }).toArray()) {
    const current: string[] = Array.isArray(post.domains) && post.domains.length ? post.domains : [post.domain]
    const next = canonicalizeDomains(current).slice(0, 3)
    if (sameList(next, post.domains ?? []) && post.domain === next[0]) continue
    backup.posts.push(post)
    console.log(`post ${post._id}: ${JSON.stringify(current)} -> ${JSON.stringify(next)}`)
    if (APPLY) await db.collection('posts').updateOne({ _id: post._id }, { $set: { domains: next, domain: next[0] } })
  }

  // Saved searches filter on a single domain name.
  for (const search of await db.collection('savedsearches').find({ 'filters.domain': { $nin: [null, ''] } }).toArray()) {
    const next = canonicalizeDomains([search.filters.domain])[0]
    if (next === search.filters.domain) continue
    backup.savedsearches.push(search)
    console.log(`saved search ${search._id}: "${search.filters.domain}" -> "${next}"`)
    if (APPLY) await db.collection('savedsearches').updateOne({ _id: search._id }, { $set: { 'filters.domain': next } })
  }

  // Profile expertise tags are free text; only the merged names are rewritten.
  for (const user of await db.collection('users').find({ expertiseTags: { $exists: true, $ne: [] } }, { projection: { expertiseTags: 1 } }).toArray()) {
    const next = canonicalizeDomains(user.expertiseTags)
    if (sameList(next, user.expertiseTags)) continue
    backup.users.push(user)
    console.log(`user ${user._id}: ${JSON.stringify(user.expertiseTags)} -> ${JSON.stringify(next)}`)
    if (APPLY) await db.collection('users').updateOne({ _id: user._id }, { $set: { expertiseTags: next } })
  }

  const changed = Object.values(backup).reduce((sum, docs) => sum + docs.length, 0)
  if (APPLY && changed > 0) {
    const backupPath = path.join(__dirname, `domain-migration-backup-${Date.now()}.json`)
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))
    console.log(`\nBackup of ${changed} original document(s) written to ${backupPath}`)
  }

  console.log(`\n${changed} document(s) ${APPLY ? 'updated' : 'would change (dry run — nothing written)'}`)
  await mongoose.disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
