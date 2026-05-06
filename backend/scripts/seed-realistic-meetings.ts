import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import Meeting from '../models/Meeting'
import Post from '../models/Post'
import User, { IUser } from '../models/User'

const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
  throw new Error('MONGO_URI is required')
}

const badMeetingPattern = /(test|smoke|deneme|lorem|ipsum|asdf|qwer|dummy|fake|COUNTRYCITYDROPDOWNDENEME|AI-powered Continuous Glucose Monitoring)/i

type MeetingSeed = {
  postTitle: string
  requesterEmail: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'declined'
  message: string
  daysAgo: number
  slots: Array<{ inDays: number; time: string }>
  confirmedSlotIndex?: number
}

const meetingSeeds: MeetingSeed[] = [
  {
    postTitle: 'Home-based heart failure monitoring from wearable vitals',
    requesterEmail: 'ahmet@metu.edu.tr',
    status: 'pending',
    message: 'I have worked with time-series vitals and can help prototype a conservative early warning baseline. I would like to understand the discharge workflow and what a useful nurse-call signal would look like.',
    daysAgo: 1,
    slots: [
      { inDays: 3, time: '10:00' },
      { inDays: 4, time: '14:30' },
      { inDays: 6, time: '11:00' },
    ],
  },
  {
    postTitle: 'Structured MRI report assistant for knee injuries',
    requesterEmail: 'mert.aydin@metu.edu.tr',
    status: 'confirmed',
    message: 'I can build a small report-structuring prototype and evaluation dashboard. It would help to see examples of report variability and the minimum fields residents must not miss.',
    daysAgo: 4,
    slots: [
      { inDays: 2, time: '09:30' },
      { inDays: 5, time: '13:00' },
      { inDays: 7, time: '16:00' },
    ],
    confirmedSlotIndex: 1,
  },
  {
    postTitle: 'Federated learning baseline for multi-hospital stroke outcome prediction',
    requesterEmail: 'ayse@hacettepe.edu.tr',
    status: 'pending',
    message: 'Our neurology team can help review endpoint definitions and discuss what outcome windows are clinically meaningful. I am especially interested in calibration by subgroup.',
    daysAgo: 5,
    slots: [
      { inDays: 1, time: '15:00' },
      { inDays: 3, time: '10:30' },
      { inDays: 8, time: '12:00' },
    ],
  },
  {
    postTitle: 'Fall-risk sensing with low-cost IMU tags in rehab wards',
    requesterEmail: 'fatma@ege.edu.tr',
    status: 'confirmed',
    message: 'I can connect you with a rehabilitation workflow perspective and help define what kind of alert would be actionable rather than noisy.',
    daysAgo: 7,
    slots: [
      { inDays: 4, time: '11:30' },
      { inDays: 6, time: '15:00' },
      { inDays: 9, time: '09:00' },
    ],
    confirmedSlotIndex: 0,
  },
  {
    postTitle: 'Explainable ECG quality filter before rhythm classification',
    requesterEmail: 'zeynep@boun.edu.tr',
    status: 'completed',
    message: 'I have an ECG preprocessing pipeline and would like to compare our artefact detection assumptions with your labelled ambulatory recordings.',
    daysAgo: 13,
    slots: [
      { inDays: -3, time: '10:00' },
      { inDays: -2, time: '13:30' },
      { inDays: 2, time: '16:00' },
    ],
    confirmedSlotIndex: 1,
  },
  {
    postTitle: 'Diabetes insulin adjustment assistant for outpatient education visits',
    requesterEmail: 'c2128035@student.cankaya.edu.tr',
    status: 'cancelled',
    message: 'I am interested in building the explainable UI layer and guardrail logic. I would like to discuss what educators need before routine visits.',
    daysAgo: 15,
    slots: [
      { inDays: -1, time: '09:00' },
      { inDays: 2, time: '14:00' },
      { inDays: 5, time: '11:00' },
    ],
  },
  {
    postTitle: 'Bone density estimation from plain X-ray: feasibility review',
    requesterEmail: 'can@itu.edu.tr',
    status: 'declined',
    message: 'I can help with imaging model uncertainty, although I am not sure the available image quality will be enough. Happy to do a feasibility review first.',
    daysAgo: 18,
    slots: [
      { inDays: -4, time: '10:00' },
      { inDays: -2, time: '13:00' },
      { inDays: 1, time: '16:30' },
    ],
  },
]

function dateDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function slotFromNow(inDays: number, time: string) {
  const date = new Date(Date.now() + inDays * 24 * 60 * 60 * 1000)
  return {
    date: date.toISOString().slice(0, 10),
    time,
  }
}

async function cleanMeetings() {
  const postIds = new Set((await Post.find().select('_id')).map(post => post.id))
  const meetings = await Meeting.find().select('_id postId postTitle')
  const badIds = meetings
    .filter(meeting => !postIds.has(meeting.postId.toString()) || badMeetingPattern.test(meeting.postTitle))
    .map(meeting => meeting._id)

  const seedTitles = meetingSeeds.map(seed => seed.postTitle)
  const [badResult, seedResult] = await Promise.all([
    badIds.length ? Meeting.deleteMany({ _id: { $in: badIds } }) : Promise.resolve({ deletedCount: 0 }),
    Meeting.deleteMany({ postTitle: { $in: seedTitles } }),
  ])

  return (badResult.deletedCount ?? 0) + (seedResult.deletedCount ?? 0)
}

async function insertMeetings() {
  const docs = []

  for (const seed of meetingSeeds) {
    const [post, requester] = await Promise.all([
      Post.findOne({ title: seed.postTitle }),
      User.findOne({ email: seed.requesterEmail }),
    ])

    if (!post) throw new Error(`Missing post: ${seed.postTitle}`)
    if (!requester) throw new Error(`Missing requester: ${seed.requesterEmail}`)

    const owner = await User.findById(post.authorId)
    if (!owner) throw new Error(`Missing owner for post: ${seed.postTitle}`)

    const proposedSlots = seed.slots.map(slot => slotFromNow(slot.inDays, slot.time))
    const confirmedSlot = seed.confirmedSlotIndex !== undefined ? proposedSlots[seed.confirmedSlotIndex] : undefined
    const createdAt = dateDaysAgo(seed.daysAgo)

    docs.push({
      postId: post._id,
      postTitle: post.title,
      requesterId: requester._id,
      requesterName: requester.name,
      requesterEmail: requester.email,
      ownerId: owner._id,
      ownerName: owner.name,
      ownerEmail: (owner as IUser).email,
      status: seed.status,
      message: seed.message,
      ndaAccepted: true,
      proposedSlots,
      confirmedSlot,
      createdAt,
      updatedAt: createdAt,
    })
  }

  await Meeting.insertMany(docs)
  return docs.length
}

async function recomputeMeetingCounts() {
  await Post.updateMany({}, { $set: { meetingCount: 0 } })
  const counts = await Meeting.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $group: { _id: '$postId', count: { $sum: 1 } } },
  ])
  await Promise.all(counts.map(row => Post.findByIdAndUpdate(row._id, { $set: { meetingCount: row.count } })))
}

async function main() {
  await mongoose.connect(MONGO_URI as string)
  const deleted = await cleanMeetings()
  const inserted = await insertMeetings()
  await recomputeMeetingCounts()
  const total = await Meeting.countDocuments()
  console.log(JSON.stringify({ deleted, inserted, total }, null, 2))
  await mongoose.disconnect()
}

main().catch(async err => {
  console.error(err)
  await mongoose.disconnect()
  process.exit(1)
})
