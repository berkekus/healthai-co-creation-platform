export type PostStatus = 'draft' | 'active' | 'meeting_scheduled' | 'partner_found' | 'expired'
export type ProjectStage = 'idea' | 'concept_validation' | 'prototype' | 'pilot' | 'pre_deployment'
export type CollaborationType = 'advisor' | 'co_founder' | 'research_partner' | 'contract'
export type ConfidentialityLevel = 'public_pitch' | 'meeting_only'
export type PostAuthorRole = 'engineer' | 'healthcare_professional'

export interface Post {
  id: string
  title: string
  authorId: string
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
  expiryDate: string
  status: PostStatus
  createdAt: string
  updatedAt: string
  interestCount: number
  meetingCount: number
}

export interface PostFilters {
  domain?: string
  expertise?: string
  city?: string
  country?: string
  projectStage?: ProjectStage
  status?: PostStatus
  search?: string
  authorRole?: PostAuthorRole
}

export interface PostCreateData {
  title: string
  domain: string
  expertiseRequired: string
  description: string
  projectStage: ProjectStage
  collaborationType: CollaborationType
  confidentiality: ConfidentialityLevel
  city: string
  country: string
  expiryDate: string
}
