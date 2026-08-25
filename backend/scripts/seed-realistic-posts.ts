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
  {
    name: 'Kaan Yildirim',
    email: 'kaan.yildirim@boun.edu.tr',
    role: 'engineer',
    institution: 'Bogazici University, Electrical & Electronics Engineering',
    city: 'Istanbul',
    country: 'Turkey',
    bio: 'Computer vision engineer working on screening tools that have to run on cheap hardware in primary care.',
    expertiseTags: ['Computer Vision', 'Medical Imaging', 'Edge Deployment', 'PyTorch'],
  },
  {
    name: 'Sanne de Vries',
    email: 'sanne.devries@tudelft.nl',
    role: 'engineer',
    institution: 'TU Delft, Faculty of Technology, Policy and Management',
    city: 'Delft',
    country: 'Netherlands',
    bio: 'Clinical NLP researcher interested in multilingual patient communication and where language models should refuse to answer.',
    expertiseTags: ['Natural Language Processing', 'Clinical NLP', 'Multilingual Systems', 'Human Factors'],
  },
  {
    name: 'Marta Nowak',
    email: 'marta.nowak@agh.edu.pl',
    role: 'engineer',
    institution: 'AGH University of Science and Technology, Krakow',
    city: 'Krakow',
    country: 'Poland',
    bio: 'Data engineer building interoperable clinical pipelines across hospital systems that were never meant to talk to each other.',
    expertiseTags: ['Data Engineering', 'FHIR', 'Interoperability', 'Time Series Analysis'],
  },
  {
    name: 'Luca Ferrari',
    email: 'luca.ferrari@polimi.it',
    role: 'engineer',
    institution: 'Politecnico di Milano, Department of Electronics and Bioengineering',
    city: 'Milan',
    country: 'Italy',
    bio: 'Embedded systems engineer working on bedside inference where latency and power budgets are as binding as accuracy.',
    expertiseTags: ['Embedded Systems', 'Signal Processing', 'Edge AI', 'Medical Devices'],
  },
  {
    name: 'Dr. Ana Rodrigues',
    email: 'ana.rodrigues@ulisboa.pt',
    role: 'engineer',
    institution: 'Universidade de Lisboa, Institute of Biophysics and Biomedical Engineering',
    city: 'Lisbon',
    country: 'Portugal',
    bio: 'Research engineer in digital pathology, mostly occupied with making other groups results reproducible.',
    expertiseTags: ['Digital Pathology', 'Reproducibility', 'Image Processing', 'Open Science'],
  },
  {
    name: 'Dr. Miguel Santos',
    email: 'miguel.santos@fundacaochampalimaud.pt',
    role: 'healthcare_professional',
    institution: 'Champalimaud Foundation, Medical Oncology',
    city: 'Lisbon',
    country: 'Portugal',
    bio: 'Medical oncologist focused on outpatient toxicity management and catching deterioration before the patient calls the unit.',
    expertiseTags: ['Oncology', 'Patient-Reported Outcomes', 'Supportive Care', 'Clinical Trials'],
  },
  {
    name: 'Dr. Ayse Tunc',
    email: 'ayse.tunc@ege.edu.tr',
    role: 'healthcare_professional',
    institution: 'Ege University Hospital, Paediatric Endocrinology',
    city: 'Izmir',
    country: 'Turkey',
    bio: 'Paediatric endocrinologist working with school-age type 1 diabetes patients and the people who care for them between visits.',
    expertiseTags: ['Pediatrics', 'Endocrinology & Diabetes', 'Caregiver Communication', 'Data Minimisation'],
  },
  {
    name: 'Dr. Katarzyna Lewandowska',
    email: 'k.lewandowska@wum.edu.pl',
    role: 'healthcare_professional',
    institution: 'Medical University of Warsaw, Department of Psychiatry',
    city: 'Warsaw',
    country: 'Poland',
    bio: 'Psychiatrist following first-episode psychosis patients, interested in what happens in the weeks between appointments.',
    expertiseTags: ['Mental Health', 'Early Intervention', 'Ecological Momentary Assessment', 'Patient Engagement'],
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
  {
    authorEmail: 'kaan.yildirim@boun.edu.tr',
    title: 'Retinal screening triage for low-cost fundus cameras',
    domain: 'Ophthalmology',
    expertiseRequired: 'Diabetic retinopathy grading, referral threshold definition, image quality review',
    description: 'Portable fundus cameras are now cheap enough for primary care, but the images they produce are far noisier than anything in the public datasets. My grading model does well on benchmark data and falls apart on the real thing. I am looking for an ophthalmologist who can tell me which failure cases actually matter clinically, and where a referral threshold should sit so that we miss as few sight-threatening cases as possible. A good starting point would be reviewing a few hundred images together and disagreeing about them.',
    projectStage: 'prototype',
    collaborationType: 'research_partner',
    confidentiality: 'meeting_only',
    city: 'Istanbul',
    country: 'Turkey',
    status: 'active',
    daysAgo: 3,
    expiresInDays: 75,
    interestCount: 4,
    meetingCount: 0,
  },
  {
    authorEmail: 'sanne.devries@tudelft.nl',
    title: 'Multilingual symptom intake for cross-border primary care',
    domain: 'Public Health & Epidemiology',
    expertiseRequired: 'Primary care triage protocols, multilingual patient communication, safety netting',
    description: 'Border-region practices regularly see patients who share no language with the clinician, and general-purpose translation apps were never built for triage. I have a prototype intake flow in Dutch, German and Turkish that produces a structured summary for the GP. What I do not have is a defensible safety net: which red-flag phrases must never be paraphrased, and what the flow should do when it is uncertain rather than guessing. I need a GP or public health clinician to draw that line with me before this goes anywhere near a waiting room.',
    projectStage: 'prototype',
    collaborationType: 'advisor',
    confidentiality: 'public_pitch',
    city: 'Delft',
    country: 'Netherlands',
    status: 'active',
    daysAgo: 6,
    expiresInDays: 70,
    interestCount: 3,
    meetingCount: 1,
  },
  {
    authorEmail: 'marta.nowak@agh.edu.pl',
    title: 'Acute kidney injury early warning across three dialysis centres',
    domain: 'Nephrology',
    expertiseRequired: 'AKI staging criteria, dialysis workflow, creatinine baseline definition',
    description: 'Three centres have agreed to share pseudonymised laboratory time series, and I can handle the pipeline and the modelling. The hard part sits upstream of both: what counts as a baseline creatinine for a patient who arrives with no prior history, and which KDIGO stage transitions are worth an alert rather than a log entry. I would much rather settle those definitions with a nephrologist now than discover in month four that the labels were wrong all along.',
    projectStage: 'concept_validation',
    collaborationType: 'research_partner',
    confidentiality: 'meeting_only',
    city: 'Krakow',
    country: 'Poland',
    status: 'active',
    daysAgo: 9,
    expiresInDays: 85,
    interestCount: 6,
    meetingCount: 1,
  },
  {
    authorEmail: 'luca.ferrari@polimi.it',
    title: 'Edge detection of ventilator waveform artefacts in the ICU',
    domain: 'Intensive Care',
    expertiseRequired: 'Mechanical ventilation, patient-ventilator asynchrony, alarm burden reduction',
    description: 'Ventilator alarms fire often enough that staff reasonably learn to tune them out. I have a small model running on a bedside device that separates genuine asynchrony from suctioning, coughing and circuit noise, and it fits the power budget with room to spare. Before any of that is worth something, I need an intensivist or respiratory therapist to tell me which asynchrony types actually change management and which are noise worth suppressing. Bench data only so far, no patient data yet.',
    projectStage: 'prototype',
    collaborationType: 'advisor',
    confidentiality: 'meeting_only',
    city: 'Milan',
    country: 'Italy',
    status: 'active',
    daysAgo: 4,
    expiresInDays: 60,
    interestCount: 2,
    meetingCount: 0,
  },
  {
    authorEmail: 'ana.rodrigues@ulisboa.pt',
    title: 'Reproducible whole-slide tiling pipeline for pathology research',
    domain: 'Pathology',
    expertiseRequired: 'Digital pathology workflows, staining variation between labs, annotation protocol design',
    description: 'Every pathology group I have worked with rebuilds the same tiling and stain normalisation code, and the results are then not comparable across studies. I want to package one that is documented, versioned and deliberately boring, so a study from Lisbon and a study from Porto can be placed side by side. I need a pathologist to tell me where the defaults are clinically wrong, particularly around staining variation between labs, and to help choose two or three reference cases to validate against.',
    projectStage: 'idea',
    collaborationType: 'research_partner',
    confidentiality: 'public_pitch',
    city: 'Lisbon',
    country: 'Portugal',
    status: 'active',
    daysAgo: 11,
    expiresInDays: 90,
    interestCount: 3,
    meetingCount: 0,
  },
  {
    authorEmail: 'miguel.santos@fundacaochampalimaud.pt',
    title: 'Symptom-triggered triage for outpatient chemotherapy toxicity',
    domain: 'Oncology',
    expertiseRequired: 'Patient-reported outcome tooling, escalation logic, accessible mobile design',
    description: 'Patients on outpatient chemotherapy call the unit when symptoms have already worsened, and by then the window for a cheap intervention has usually closed. We collect weekly symptom scores on paper today. I would like to test whether a short daily check-in with clear escalation rules reaches those patients earlier. I am not asking for a prediction model yet: I need something simple enough that an eighty-year-old will still use it on day twelve, and someone willing to help design the study around it.',
    projectStage: 'concept_validation',
    collaborationType: 'research_partner',
    confidentiality: 'meeting_only',
    city: 'Lisbon',
    country: 'Portugal',
    status: 'active',
    daysAgo: 1,
    expiresInDays: 80,
    interestCount: 7,
    meetingCount: 2,
  },
  {
    authorEmail: 'ayse.tunc@ege.edu.tr',
    title: 'Type 1 diabetes handover support for school-age patients',
    domain: 'Pediatrics',
    expertiseRequired: 'Mobile design for children, caregiver access control, data minimisation',
    description: 'Our paediatric type 1 patients move between home, school and clinic, and the information moves considerably worse than they do. Teachers get a paper card, parents get a phone call, and we see a glucose log three months later. I want a small tool where the care plan fits on one screen, a teacher sees only what they need for that day, and nothing sensitive is stored on a school device. The design constraints matter more than the technology here, and I am looking for an engineer who finds that interesting rather than limiting.',
    projectStage: 'idea',
    collaborationType: 'research_partner',
    confidentiality: 'public_pitch',
    city: 'Izmir',
    country: 'Turkey',
    status: 'active',
    daysAgo: 7,
    expiresInDays: 75,
    interestCount: 5,
    meetingCount: 0,
  },
  {
    authorEmail: 'k.lewandowska@wum.edu.pl',
    title: 'Early warning signs in first-episode psychosis follow-up',
    domain: 'Mental Health',
    expertiseRequired: 'Ecological momentary assessment, engagement design, privacy-first data handling',
    description: 'Relapse in first-episode psychosis is often visible weeks ahead to family members, and sometimes to the patient, but not to us between appointments. I am interested in a lightweight self-report tool that patients would genuinely keep using, which is precisely where most projects of this kind die. I need an engineer willing to design for engagement first and analytics second, and comfortable with a study whose primary outcome is whether anyone is still using it after three months.',
    projectStage: 'idea',
    collaborationType: 'advisor',
    confidentiality: 'meeting_only',
    city: 'Warsaw',
    country: 'Poland',
    status: 'active',
    daysAgo: 13,
    expiresInDays: 70,
    interestCount: 4,
    meetingCount: 1,
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
