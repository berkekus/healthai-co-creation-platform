import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import Post, { IPost } from '../models/Post'
import User, { IUser } from '../models/User'

const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
  throw new Error('MONGO_URI is required')
}

type SeedUser = {
  name: string
  email: string
  role: 'engineer' | 'healthcare_professional'
  institution: string
  city: string
  country: string
  bio: string
  expertiseTags: string[]
}

const seedUsers: SeedUser[] = [
  {
    name: 'Dr. Elif Kaya',
    email: 'elif.kaya@istanbul.edu.tr',
    role: 'healthcare_professional',
    institution: 'Istanbul University, Cardiology Department',
    city: 'Istanbul',
    country: 'Turkey',
    bio: 'Interventional cardiologist working on early deterioration signals in ambulatory heart failure patients.',
    expertiseTags: ['Cardiology', 'Heart Failure', 'Remote Monitoring', 'Clinical Validation'],
  },
  {
    name: 'Mert Aydin',
    email: 'mert.aydin@metu.edu.tr',
    role: 'engineer',
    institution: 'METU, Computer Engineering',
    city: 'Ankara',
    country: 'Turkey',
    bio: 'ML engineer focused on privacy-preserving learning, medical imaging pipelines and production-grade model deployment.',
    expertiseTags: ['Machine Learning', 'Federated Learning', 'Python', 'MLOps', 'Medical Imaging'],
  },
  {
    name: 'Dr. Sofia Marin',
    email: 'sofia.marin@clinicbarcelona.org',
    role: 'healthcare_professional',
    institution: 'Hospital Clinic Barcelona',
    city: 'Barcelona',
    country: 'Spain',
    bio: 'Endocrinologist interested in patient-facing decision support for diabetes and metabolic disease.',
    expertiseTags: ['Endocrinology', 'Diabetes', 'Patient Safety', 'Clinical Workflows'],
  },
  {
    name: 'Jonas Keller',
    email: 'jonas.keller@tum.de',
    role: 'engineer',
    institution: 'Technical University of Munich',
    city: 'Munich',
    country: 'Germany',
    bio: 'Biomedical engineer building wearable sensor systems and lightweight inference pipelines.',
    expertiseTags: ['Wearables', 'Signal Processing', 'Edge AI', 'Rehabilitation'],
  },
  {
    name: 'Dr. Narin Demir',
    email: 'narin.demir@hacettepe.edu.tr',
    role: 'healthcare_professional',
    institution: 'Hacettepe University Hospital',
    city: 'Ankara',
    country: 'Turkey',
    bio: 'Radiologist working with musculoskeletal MRI and structured reporting.',
    expertiseTags: ['Radiology', 'MRI', 'Orthopedics', 'Clinical Annotation'],
  },
]

type PostSeed = Pick<IPost,
  'title' | 'domain' | 'expertiseRequired' | 'description' | 'projectStage' |
  'collaborationType' | 'confidentiality' | 'city' | 'country' | 'status'
> & {
  authorEmail: string
  daysAgo: number
  expiresInDays: number
  interestCount?: number
  meetingCount?: number
}

const posts: PostSeed[] = [
  {
    authorEmail: 'elif.kaya@istanbul.edu.tr',
    title: 'Home-based heart failure monitoring from wearable vitals',
    domain: 'Cardiology',
    expertiseRequired: 'Time-series modelling, wearable signal quality checks, patient risk stratification',
    description: 'Our clinic follows a growing group of heart failure patients after discharge. We collect weight, pulse, blood pressure and symptom diaries, but the review process is still manual. I am looking for an engineering partner to prototype a simple risk signal that highlights patients who may need a nurse call within the next 48 hours. We can start with a retrospective dataset and a small clinician review loop.',
    projectStage: 'concept_validation',
    collaborationType: 'research_partner',
    confidentiality: 'meeting_only',
    city: 'Istanbul',
    country: 'Turkey',
    status: 'active',
    daysAgo: 2,
    expiresInDays: 80,
    interestCount: 5,
    meetingCount: 1,
  },
  {
    authorEmail: 'mert.aydin@metu.edu.tr',
    title: 'Federated learning baseline for multi-hospital stroke outcome prediction',
    domain: 'Neurology',
    expertiseRequired: 'Clinical endpoint definition, stroke registry familiarity, federated evaluation design',
    description: 'We have a working federated training scaffold and need clinical collaborators who can help define meaningful stroke outcome labels. The first milestone is not a perfect model; it is a reproducible baseline that hospitals can inspect and challenge. I can handle the engineering and privacy-preserving setup, but I need help with inclusion criteria and failure case review.',
    projectStage: 'prototype',
    collaborationType: 'research_partner',
    confidentiality: 'meeting_only',
    city: 'Ankara',
    country: 'Turkey',
    status: 'active',
    daysAgo: 5,
    expiresInDays: 120,
    interestCount: 9,
    meetingCount: 2,
  },
  {
    authorEmail: 'sofia.marin@clinicbarcelona.org',
    title: 'Diabetes insulin adjustment assistant for outpatient education visits',
    domain: 'Endocrinology & Diabetes',
    expertiseRequired: 'Rule-based clinical decision support, explainable UI, safety guardrail design',
    description: 'I am not looking for a black-box insulin recommender. The need is a transparent assistant that helps educators prepare structured talking points before routine visits. Inputs would be glucose logs, recent hypoglycemia events and current regimen. The output should be conservative, explainable and easy to override.',
    projectStage: 'idea',
    collaborationType: 'advisor',
    confidentiality: 'public_pitch',
    city: 'Barcelona',
    country: 'Spain',
    status: 'active',
    daysAgo: 8,
    expiresInDays: 95,
    interestCount: 3,
  },
  {
    authorEmail: 'jonas.keller@tum.de',
    title: 'Fall-risk sensing with low-cost IMU tags in rehab wards',
    domain: 'Geriatrics & Rehabilitation',
    expertiseRequired: 'Geriatric rehabilitation workflow, fall-risk assessment, pilot protocol feedback',
    description: 'I built a small IMU-based pipeline that detects gait instability patterns on-device. It needs clinical reality. I would like to speak with a rehab ward team about where such alerts would actually fit, what counts as a useful signal, and how to avoid alarm fatigue during a two-week observational pilot.',
    projectStage: 'pilot',
    collaborationType: 'co_founder',
    confidentiality: 'meeting_only',
    city: 'Munich',
    country: 'Germany',
    status: 'active',
    daysAgo: 11,
    expiresInDays: 70,
    interestCount: 6,
    meetingCount: 1,
  },
  {
    authorEmail: 'narin.demir@hacettepe.edu.tr',
    title: 'Structured MRI report assistant for knee injuries',
    domain: 'Orthopedics',
    expertiseRequired: 'NLP for clinical text, radiology report structuring, evaluation dashboard',
    description: 'Our residents spend a lot of time turning observations into consistent knee MRI reports. I want to explore a tool that suggests a structured draft from dictated findings, not a diagnostic model. The ideal collaborator has experience with medical NLP and can build a small review interface for radiologists.',
    projectStage: 'concept_validation',
    collaborationType: 'research_partner',
    confidentiality: 'meeting_only',
    city: 'Ankara',
    country: 'Turkey',
    status: 'active',
    daysAgo: 14,
    expiresInDays: 100,
    interestCount: 4,
  },
  {
    authorEmail: 'mert.aydin@metu.edu.tr',
    title: 'Lightweight triage model for emergency department sepsis alerts',
    domain: 'Emergency Medicine',
    expertiseRequired: 'Sepsis screening practice, retrospective label review, false-positive analysis',
    description: 'I can deploy a lightweight tabular model on admission vitals and basic labs. What I need is a clinical partner who can help us avoid the usual trap: too many noisy alerts. The project would start with a retrospective audit and focus on calibration and workflow impact.',
    projectStage: 'prototype',
    collaborationType: 'research_partner',
    confidentiality: 'meeting_only',
    city: 'Ankara',
    country: 'Turkey',
    status: 'meeting_scheduled',
    daysAgo: 20,
    expiresInDays: 60,
    interestCount: 8,
    meetingCount: 3,
  },
  {
    authorEmail: 'elif.kaya@istanbul.edu.tr',
    title: 'Explainable ECG quality filter before rhythm classification',
    domain: 'Cardiology',
    expertiseRequired: 'Signal processing, ECG artefact detection, explainable model outputs',
    description: 'Before talking about arrhythmia classification, we need to reject bad ECG strips reliably. I have a small labelled set of noisy ambulatory recordings and can help annotate more. Looking for someone who enjoys signal quality problems and can keep the model interpretable.',
    projectStage: 'prototype',
    collaborationType: 'contract',
    confidentiality: 'meeting_only',
    city: 'Istanbul',
    country: 'Turkey',
    status: 'active',
    daysAgo: 23,
    expiresInDays: 45,
    interestCount: 7,
    meetingCount: 1,
  },
  {
    authorEmail: 'sofia.marin@clinicbarcelona.org',
    title: 'Patient-friendly explanation layer for CGM pattern summaries',
    domain: 'Clinical Pharmacy',
    expertiseRequired: 'Human-centered AI, natural language generation, diabetes education workflows',
    description: 'CGM dashboards are still hard for many patients. I want to co-design a short explanation layer that translates weekly patterns into plain language. The main challenge is tone: helpful but not alarming, specific but not overconfident.',
    projectStage: 'idea',
    collaborationType: 'advisor',
    confidentiality: 'public_pitch',
    city: 'Barcelona',
    country: 'Spain',
    status: 'active',
    daysAgo: 27,
    expiresInDays: 110,
    interestCount: 2,
  },
  {
    authorEmail: 'jonas.keller@tum.de',
    title: 'On-device cough episode detection for respiratory monitoring',
    domain: 'Pulmonology',
    expertiseRequired: 'Respiratory medicine input, audio annotation protocol, clinical validation planning',
    description: 'We have an early edge-audio model that detects cough episodes without uploading raw audio. I need clinical guidance on what would make this useful for asthma or COPD follow-up, and how to design annotation without creating privacy concerns.',
    projectStage: 'concept_validation',
    collaborationType: 'research_partner',
    confidentiality: 'meeting_only',
    city: 'Munich',
    country: 'Germany',
    status: 'active',
    daysAgo: 34,
    expiresInDays: 130,
    interestCount: 4,
  },
  {
    authorEmail: 'narin.demir@hacettepe.edu.tr',
    title: 'Bone density estimation from plain X-ray: feasibility review',
    domain: 'Radiology',
    expertiseRequired: 'Computer vision, model uncertainty, dataset curation for X-ray studies',
    description: 'This is an early feasibility question. We routinely see patients who had X-rays but no DEXA scan. I want to understand whether a careful CV study could estimate risk groups from existing images, with uncertainty clearly shown. A collaborator with medical imaging experience would be ideal.',
    projectStage: 'idea',
    collaborationType: 'research_partner',
    confidentiality: 'meeting_only',
    city: 'Ankara',
    country: 'Turkey',
    status: 'active',
    daysAgo: 39,
    expiresInDays: 150,
    interestCount: 5,
  },
  {
    authorEmail: 'mert.aydin@metu.edu.tr',
    title: 'Privacy-preserving dermatology image annotation workspace',
    domain: 'Dermatology',
    expertiseRequired: 'Dermatology annotation guidelines, lesion taxonomy, reviewer agreement metrics',
    description: 'I am building a secure annotation workspace where images stay inside the institution and only labels/metrics leave. Need dermatology partners to define the label set and decide what disagreement metrics are clinically meaningful.',
    projectStage: 'pre_deployment',
    collaborationType: 'co_founder',
    confidentiality: 'meeting_only',
    city: 'Ankara',
    country: 'Turkey',
    status: 'partner_found',
    daysAgo: 48,
    expiresInDays: 30,
    interestCount: 12,
    meetingCount: 4,
  },
  {
    authorEmail: 'elif.kaya@istanbul.edu.tr',
    title: 'Draft: follow-up questions for cardiac rehab chatbot study',
    domain: 'Cardiology',
    expertiseRequired: 'Conversational UX, safety escalation logic, rehabilitation education content',
    description: 'Draft notes for a possible cardiac rehab chatbot. Still narrowing the scope before publishing.',
    projectStage: 'idea',
    collaborationType: 'advisor',
    confidentiality: 'meeting_only',
    city: 'Istanbul',
    country: 'Turkey',
    status: 'draft',
    daysAgo: 3,
    expiresInDays: 90,
  },
]

const badPostPattern = /(test|smoke|deneme|lorem|ipsum|asdf|qwer|dummy|sample|fake)/i
const repeatedTextPattern = /(.)\1{12,}/
const legacyDemoTitles = [
  'AI-powered Continuous Glucose Monitoring',
]

function dateDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function dateDaysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

async function ensureUsers() {
  const password = await bcrypt.hash('HealthAI2026!', 12)
  const users: IUser[] = []

  for (const seed of seedUsers) {
    const user = await User.findOneAndUpdate(
      { email: seed.email },
      {
        $setOnInsert: {
          password,
          isVerified: true,
          isSuspended: false,
          lastActive: dateDaysAgo(Math.floor(Math.random() * 12) + 1),
        },
        $set: {
          name: seed.name,
          role: seed.role,
          institution: seed.institution,
          city: seed.city,
          country: seed.country,
          bio: seed.bio,
          expertiseTags: seed.expertiseTags,
        },
      },
      { new: true, upsert: true },
    )
    users.push(user)
  }

  const existing = await User.find({
    role: { $in: ['engineer', 'healthcare_professional'] },
    isSuspended: false,
  })

  return [...existing, ...users].filter((user, index, arr) =>
    arr.findIndex(item => item.id === user.id) === index,
  )
}

async function cleanBadPosts() {
  const allPosts = await Post.find().select('title description')
  const badIds = allPosts
    .filter(post => badPostPattern.test(`${post.title} ${post.description}`) || repeatedTextPattern.test(`${post.title} ${post.description}`))
    .map(post => post._id)

  const seedTitles = posts.map(post => post.title)
  const [badResult, seedResult, legacyResult] = await Promise.all([
    badIds.length ? Post.deleteMany({ _id: { $in: badIds } }) : Promise.resolve({ deletedCount: 0 }),
    Post.deleteMany({ title: { $in: seedTitles } }),
    Post.deleteMany({ title: { $in: legacyDemoTitles } }),
  ])

  return (badResult.deletedCount ?? 0) + (seedResult.deletedCount ?? 0) + (legacyResult.deletedCount ?? 0)
}

async function insertPosts(users: IUser[]) {
  const byEmail = new Map(users.map(user => [user.email, user]))

  const docs = posts.map(seed => {
    const author = byEmail.get(seed.authorEmail)
    if (!author) throw new Error(`Missing seed author: ${seed.authorEmail}`)

    const createdAt = dateDaysAgo(seed.daysAgo)
    const updatedAt = new Date(createdAt.getTime() + Math.min(seed.daysAgo, 6) * 8 * 60 * 60 * 1000)

    return {
      title: seed.title,
      authorId: author._id,
      authorName: author.name,
      authorRole: author.role,
      domain: seed.domain,
      expertiseRequired: seed.expertiseRequired,
      description: seed.description,
      projectStage: seed.projectStage,
      collaborationType: seed.collaborationType,
      confidentiality: seed.confidentiality,
      city: seed.city,
      country: seed.country,
      expiryDate: dateDaysFromNow(seed.expiresInDays),
      status: seed.status,
      interestCount: seed.interestCount ?? 0,
      meetingCount: seed.meetingCount ?? 0,
      interestedUserIds: [],
      createdAt,
      updatedAt,
    }
  })

  await Post.insertMany(docs)
  return docs.length
}

async function repairPostAuthors() {
  const existingPosts = await Post.find()
  let repaired = 0

  for (const post of existingPosts) {
    const author = await User.findById(post.authorId).select('name role')
    if (!author || author.role === 'admin') continue
    if (post.authorName !== author.name || post.authorRole !== author.role) {
      post.authorName = author.name
      post.authorRole = author.role
      await post.save()
      repaired += 1
    }
  }

  return repaired
}

async function main() {
  await mongoose.connect(MONGO_URI as string)

  const users = await ensureUsers()
  const deleted = await cleanBadPosts()
  const inserted = await insertPosts(users)
  const repaired = await repairPostAuthors()
  const total = await Post.countDocuments()

  console.log(JSON.stringify({ deleted, inserted, repaired, total }, null, 2))
  await mongoose.disconnect()
}

main().catch(async err => {
  console.error(err)
  await mongoose.disconnect()
  process.exit(1)
})
