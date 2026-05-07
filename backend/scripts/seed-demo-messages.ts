/**
 * Seed script: creates a realistic confirmed meeting + conversation + messages
 * between the demo doctor (elif.kaya) and engineer (mert.aydin) accounts.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/seed-demo-messages.ts
 */

import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import User from '../models/User'
import Post from '../models/Post'
import Meeting from '../models/Meeting'
import Conversation from '../models/Conversation'
import Message from '../models/Message'

const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) throw new Error('MONGO_URI is required')

const DOCTOR_EMAIL  = 'elif.kaya@istanbul.edu.tr'
const ENGINEER_EMAIL = 'mert.aydin@metu.edu.tr'

// Realistic back-and-forth messages
const DEMO_MESSAGES = [
  { fromDoctor: true,  content: 'Hello Mert! Really glad the meeting got confirmed. I have been looking forward to collaborating on the heart failure monitoring project. Did you have time to review the dataset overview I mentioned?' },
  { fromDoctor: false, content: 'Hi Dr. Kaya! Yes, I went through the outline. The retrospective cohort looks very solid — roughly 18 months of daily readings per patient is more than enough to build a meaningful baseline model. One question: is the weight data self-reported by patients or captured by a connected scale?' },
  { fromDoctor: true,  content: 'Good question. We have a mix — about 60% from connected scales synced to the hospital portal, the remaining 40% self-reported via a mobile app. I can flag the source in the metadata if that helps you weight the features differently.' },
  { fromDoctor: false, content: 'That would be really useful, thank you. For the first milestone I was thinking we start with a simple logistic regression baseline to identify which vitals are most predictive of a nurse call within 48 hours. That gives us something interpretable to show the clinicians before we move to anything more complex.' },
  { fromDoctor: true,  content: 'Completely agree. Interpretability is important here — the cardiologists on my team will not trust a black-box model for clinical decisions. A logistic regression with clear feature coefficients is the right starting point. Shall we schedule a 30-minute call this week to align on inclusion/exclusion criteria?' },
  { fromDoctor: false, content: 'Sounds great. I am free Thursday afternoon (after 14:00 Istanbul time) or Friday morning. I will set up a shared Git repo in the meantime and push a basic data loading notebook so you can verify the column names match what you expect from your export.' },
  { fromDoctor: true,  content: 'Thursday at 15:00 Istanbul time works perfectly for me. I will send a calendar invite. And thank you for setting up the repo — that will save us a lot of back-and-forth later. Should I loop in our data manager for the export format?' },
  { fromDoctor: false, content: 'Yes please, it would be great to have them on the first call. Also, one thing to confirm early: will the export be fully anonymised before it leaves the hospital system, or do we need to go through a formal DPA process on our end too?' },
  { fromDoctor: true,  content: 'The data is pseudonymised at source — patient IDs are replaced with random tokens before export, and no names or contact details are included. We have an existing DPA with the ethics board that covers this type of research collaboration. I will share the relevant section with you before Thursday.' },
  { fromDoctor: false, content: 'Perfect, that is reassuring. I will review it ahead of the call. Looking forward to Thursday — this is exactly the kind of grounded, real-world collaboration I was hoping to find through the platform!' },
]

async function main() {
  await mongoose.connect(MONGO_URI as string)
  console.log('MongoDB connected')

  // 1. Find users
  const doctor   = await User.findOne({ email: DOCTOR_EMAIL })
  const engineer = await User.findOne({ email: ENGINEER_EMAIL })

  if (!doctor || !engineer) {
    console.error('Dev users not found. Run seed-realistic-posts first.')
    process.exit(1)
  }

  // 2. Find or pick a post authored by the doctor
  const post = await Post.findOne({ authorId: doctor._id }).sort({ createdAt: -1 })
  if (!post) {
    console.error('No post found for doctor. Run seed-realistic-posts first.')
    process.exit(1)
  }

  // 3. Create or find the demo meeting
  const confirmedSlot = { date: '2026-05-15', time: '15:00' }
  let meeting = await Meeting.findOne({
    requesterId: engineer._id,
    ownerId: doctor._id,
    status: 'confirmed',
  })

  if (!meeting) {
    meeting = await Meeting.create({
      postId:        post._id,
      postTitle:     post.title,
      requesterId:   engineer._id,
      requesterName: engineer.name,
      requesterEmail: engineer.email,
      ownerId:       doctor._id,
      ownerName:     doctor.name,
      ownerEmail:    doctor.email,
      status:        'confirmed',
      message:       'I have reviewed your heart failure monitoring post and believe my federated learning and MLOps background aligns well with your needs. I would love to collaborate on building an interpretable early-warning model using your retrospective dataset.',
      ndaAccepted:   true,
      proposedSlots: [
        { date: '2026-05-12', time: '14:00' },
        { date: '2026-05-13', time: '10:00' },
        { date: '2026-05-15', time: '15:00' },
      ],
      confirmedSlot,
    })
    console.log(`✓ Meeting created: ${meeting.id}`)
  } else {
    console.log(`✓ Meeting already exists: ${meeting.id}`)
  }

  // 4. Create or find the conversation
  let conv = await Conversation.findOne({ meetingId: meeting._id })

  if (!conv) {
    conv = await Conversation.create({
      meetingId: meeting._id,
      postId:    post._id,
      postTitle: post.title,
      participants: [engineer._id, doctor._id],
      participantDetails: [
        { userId: engineer._id, name: engineer.name, role: engineer.role },
        { userId: doctor._id,   name: doctor.name,   role: doctor.role  },
      ],
      lastMessageAt:      new Date(),
      lastMessagePreview: '',
    })
    console.log(`✓ Conversation created: ${conv.id}`)
  } else {
    console.log(`✓ Conversation already exists: ${conv.id}`)
    // Clear existing messages to avoid duplicates on re-run
    await Message.deleteMany({ conversationId: conv._id })
    console.log('  Existing messages cleared.')
  }

  // 5. Insert messages with realistic timestamps (spread over 2 days)
  const baseTime = Date.now() - 2 * 24 * 60 * 60 * 1000 // 2 days ago
  const messages = DEMO_MESSAGES.map((m, i) => ({
    conversationId: conv!._id,
    senderId:   m.fromDoctor ? doctor._id : engineer._id,
    senderName: m.fromDoctor ? doctor.name : engineer.name,
    content:    m.content,
    readBy:     [doctor._id, engineer._id],
    createdAt:  new Date(baseTime + i * 28 * 60 * 1000), // ~28 min apart
    updatedAt:  new Date(baseTime + i * 28 * 60 * 1000),
  }))

  await Message.insertMany(messages)

  // Update conversation preview
  const last = DEMO_MESSAGES[DEMO_MESSAGES.length - 1]
  await Conversation.updateOne(
    { _id: conv._id },
    {
      lastMessageAt:      messages[messages.length - 1].createdAt,
      lastMessagePreview: last.content.slice(0, 80) + '…',
    },
  )

  console.log(`✓ ${messages.length} demo messages inserted`)
  console.log('\nDone! Log in as the doctor or engineer to see the conversation.')
  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
