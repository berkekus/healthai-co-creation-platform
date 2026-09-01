import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

/**
 * Resets an account's password.
 *
 *   npm run reset-password -- <email> <new-password>
 *
 * The password is an argument rather than a constant so a working credential
 * never sits in the repository — the previous version of this script carried
 * one, alongside an admin address that no longer exists.
 *
 * Cost 12 matches authService, so a hash written here behaves like one written
 * by the app itself.
 */
const SALT_ROUNDS = 12

async function main() {
  const [email, password] = process.argv.slice(2)

  if (!email || !password) {
    console.error('Usage: npm run reset-password -- <email> <new-password>')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('Refusing: the app requires at least 8 characters, so a shorter one would lock the account out of its own login form.')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI as string)

  const users = mongoose.connection.collection('users')
  const existing = await users.findOne({ email: email.toLowerCase() })
  if (!existing) {
    console.error(`No such user: ${email}`)
    await mongoose.disconnect()
    process.exit(1)
  }

  await users.updateOne(
    { _id: existing._id },
    { $set: { password: await bcrypt.hash(password, SALT_ROUNDS), updatedAt: new Date() } },
  )

  // Never print the password: this output ends up in terminals and CI logs.
  console.log(JSON.stringify({
    email: existing.email,
    role: existing.role,
    isVerified: existing.isVerified,
    isSuspended: existing.isSuspended,
    passwordReset: true,
  }, null, 2))

  await mongoose.disconnect()
}

main().catch(async err => {
  console.error(err)
  await mongoose.disconnect()
  process.exit(1)
})
