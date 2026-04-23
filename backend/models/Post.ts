import { Schema, model, Document, Types } from 'mongoose'

export type PostStatus = 'draft' | 'active' | 'meeting_scheduled' | 'partner_found' | 'expired'
export type ProjectStage = 'idea' | 'concept_validation' | 'prototype' | 'pilot' | 'pre_deployment'
export type CollaborationType = 'advisor' | 'co_founder' | 'research_partner' | 'contract'
export type ConfidentialityLevel = 'public_pitch' | 'meeting_only'
export type PostAuthorRole = 'engineer' | 'healthcare_professional'

export interface IPost extends Document {
  title: string
  authorId: Types.ObjectId
  authorName: string
  authorRole: PostAuthorRole
  domain: string
  expertiseRequired: string
  description: string
  projectStage: ProjectStage
  collaborationType: CollaborationType
  confidentiality: ConfidentialityLevel
  city: string
  country: string
  expiryDate: Date
  status: PostStatus
  interestCount: number
  meetingCount: number
  createdAt: Date
  updatedAt: Date
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true, trim: true },
    authorRole: {
      type: String,
      enum: ['engineer', 'healthcare_professional'],
      required: true,
    },
    domain: { type: String, required: true, trim: true },
    expertiseRequired: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    projectStage: {
      type: String,
      enum: ['idea', 'concept_validation', 'prototype', 'pilot', 'pre_deployment'],
      required: true,
    },
    collaborationType: {
      type: String,
      enum: ['advisor', 'co_founder', 'research_partner', 'contract'],
      required: true,
    },
    confidentiality: {
      type: String,
      enum: ['public_pitch', 'meeting_only'],
      required: true,
    },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'meeting_scheduled', 'partner_found', 'expired'],
      default: 'draft',
    },
    interestCount: { type: Number, default: 0, min: 0 },
    meetingCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret },
    },
  }
)

PostSchema.index({ authorId: 1 })
PostSchema.index({ status: 1 })
PostSchema.index({ domain: 1 })
PostSchema.index({ country: 1, city: 1 })

export default model<IPost>('Post', PostSchema)
