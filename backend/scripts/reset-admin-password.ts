import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const NEW_PASSWORD = 'Admin1234!'
const ADMIN_EMAIL  = 'admin@healthai.edu'

async function main() {
  await mongoose.connect(process.env.MONGO_URI as string)
  console.log('MongoDB connected')

  const hashed = await bcrypt.hash(NEW_PASSWORD, 10)
  const result = await mongoose.connection
    .collection('users')
    .updateOne({ email: ADMIN_EMAIL }, { $set: { password: hashed } })

  if (result.matchedCount === 0) {
    console.error(`User not found: ${ADMIN_EMAIL}`)
  } else {
    console.log(`Password reset OK → ${NEW_PASSWORD}`)
  }

  await mongoose.disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
