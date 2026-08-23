import dotenv from 'dotenv'
dotenv.config()

import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'

/**
 * One-off data fix for notifications created before the diacritics/type bugs
 * (see FRONTEND_TEST_FINDINGS.md #8) were fixed in meetingService.ts,
 * postService.ts, and conversationService.ts. Only touches documents that
 * still contain the exact old broken strings — never a broad rewrite.
 *
 * Writes a JSON backup of every document's before-state next to this script
 * before mutating anything, then applies the fixes.
 */

const APPLY = process.argv.includes('--apply')

type Rule = {
  name: string
  filter: Record<string, unknown>
  update: (title: string, body: string) => { title: string; body: string }
}

const rules: Rule[] = [
  {
    name: 'meeting_request diacritics',
    filter: { type: 'meeting_request', title: 'Yeni toplanti istegi' },
    update: (title, body) => ({
      title: 'Yeni toplantı isteği',
      body: body.replace('icin toplanti talep etti.', 'için toplantı talep etti.'),
    }),
  },
  {
    name: 'meeting_accepted diacritics',
    filter: { type: 'meeting_accepted', title: 'Toplanti kabul edildi' },
    update: (title, body) => ({
      title: 'Toplantı kabul edildi',
      body: body
        .replace('toplanti talebinizi kabul etti', 'toplantı talebinizi kabul etti')
        .replace('onayini', 'onayını'),
    }),
  },
  {
    name: 'meeting_declined diacritics',
    filter: { type: 'meeting_declined', title: 'Toplanti reddedildi' },
    update: (title, body) => ({
      title: 'Toplantı reddedildi',
      body: body.replace('toplanti talebinizi reddetti', 'toplantı talebinizi reddetti'),
    }),
  },
  {
    name: 'meeting_cancelled diacritics',
    filter: { type: 'meeting_cancelled', title: 'Toplanti iptal edildi' },
    update: (title, body) => ({
      title: 'Toplantı iptal edildi',
      body: body.replace('toplanti talebini iptal etti', 'toplantı talebini iptal etti'),
    }),
  },
  {
    name: 'saved-search English title',
    filter: { type: 'interest_received', title: 'New post matches your saved search' },
    update: (_title, body) => ({
      title: 'Kayıtlı aramanızla eşleşen yeni ilan',
      body,
    }),
  },
  {
    name: 'new_message mistyped as meeting_request',
    filter: { type: 'meeting_request', title: { $regex: '^New message from ' } },
    update: (title, body) => ({
      title: `${title.replace(/^New message from /, '')} yeni bir mesaj gönderdi`,
      body,
    }),
  },
]

async function main() {
  await mongoose.connect(process.env.MONGO_URI as string)
  console.log('MongoDB connected —', APPLY ? 'APPLY mode' : 'DRY RUN (pass --apply to write changes)')

  const col = mongoose.connection.collection('notifications')
  const backup: unknown[] = []
  let totalMatched = 0

  for (const rule of rules) {
    const docs = await col.find(rule.filter).toArray()
    totalMatched += docs.length
    console.log(`\n[${rule.name}] matched ${docs.length} document(s)`)

    for (const doc of docs) {
      const { title: newTitle, body: newBody } = rule.update(doc.title, doc.body)
      backup.push({ _id: doc._id, type: doc.type, title: doc.title, body: doc.body })
      console.log(`  ${doc._id}`)
      console.log(`    title: "${doc.title}" -> "${newTitle}"`)
      console.log(`    body:  "${doc.body}" -> "${newBody}"`)

      if (APPLY) {
        const set: Record<string, unknown> = { title: newTitle, body: newBody }
        if (rule.name === 'new_message mistyped as meeting_request') set.type = 'new_message'
        await col.updateOne({ _id: doc._id }, { $set: set })
      }
    }
  }

  if (backup.length > 0) {
    const backupPath = path.join(__dirname, `notification-fix-backup-${Date.now()}.json`)
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))
    console.log(`\nBackup of ${backup.length} original document(s) written to ${backupPath}`)
  }

  console.log(`\nTotal matched: ${totalMatched}${APPLY ? ' (updated)' : ' (dry run — nothing written)'}`)
  await mongoose.disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
