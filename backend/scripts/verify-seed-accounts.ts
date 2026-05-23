import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'

const SEED_EMAILS = [
  'admin@healthai.edu',
  'elif.kaya@istanbul.edu.tr',
  'mert.aydin@metu.edu.tr',
]

async function main() {
  await mongoose.connect(process.env.MONGO_URI as string)
  console.log('MongoDB connected')

  for (const email of SEED_EMAILS) {
    const result = await mongoose.connection
      .collection('users')
      .updateOne(
        { email },
        { $set: { isVerified: true }, $unset: { verifyToken: '', verifyTokenExpires: '' } }
      )
    if (result.matchedCount === 0) {
      console.warn(`  NOT FOUND: ${email}`)
    } else {
      console.log(`  verified: ${email}`)
    }
  }

  await mongoose.disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
