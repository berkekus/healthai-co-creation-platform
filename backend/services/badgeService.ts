import User, { type BadgeId } from '../models/User'
import Post from '../models/Post'
import Meeting from '../models/Meeting'
import Comment from '../models/Comment'

// Early adopter cutoff: accounts before June 2026
const EARLY_ADOPTER_CUTOFF = new Date('2026-06-01')

const BADGE_POINTS: Record<BadgeId, number> = {
  first_post:           10,
  active_collaborator:  25,
  trusted_partner:      50,
  community_helper:     15,
  profile_complete:     20,
  early_adopter:        30,
}

async function computeBadges(userId: string): Promise<BadgeId[]> {
  const [user, postCount, confirmedMeetings, completedMeetings, commentCount] = await Promise.all([
    User.findById(userId).select('bio expertiseTags institution city country avatarUrl createdAt'),
    Post.countDocuments({ authorId: userId, status: { $ne: 'draft' } }),
    Meeting.countDocuments({
      $or: [{ requesterId: userId }, { ownerId: userId }],
      status: { $in: ['confirmed', 'completed'] },
    }),
    Meeting.countDocuments({
      $or: [{ requesterId: userId }, { ownerId: userId }],
      status: 'completed',
    }),
    Comment.countDocuments({ authorId: userId }),
  ])

  if (!user) return []

  const earned: BadgeId[] = []

  if (postCount >= 1) earned.push('first_post')
  if (confirmedMeetings >= 3) earned.push('active_collaborator')
  if (completedMeetings >= 5) earned.push('trusted_partner')
  if (commentCount >= 10) earned.push('community_helper')
  if (user.createdAt < EARLY_ADOPTER_CUTOFF) earned.push('early_adopter')

  // Profile completeness: 6 fields, need 5+
  const profileFields = [user.bio, user.institution, user.city, user.country, user.avatarUrl]
  const tagsFilled = (user.expertiseTags?.length ?? 0) >= 3
  const fieldsFilled = profileFields.filter(Boolean).length + (tagsFilled ? 1 : 0)
  if (fieldsFilled >= 5) earned.push('profile_complete')

  return earned
}

export async function recalculateBadges(userId: string): Promise<void> {
  const badges = await computeBadges(userId)
  const score = badges.reduce((sum, b) => sum + BADGE_POINTS[b], 0)
  await User.updateOne({ _id: userId }, { badges, collaborationScore: score })
}

export const BADGE_META: Record<BadgeId, { label: string; icon: string; description: string }> = {
  first_post:          { label: 'First Post',           icon: 'edit_note',           description: 'Published your first collaboration post' },
  active_collaborator: { label: 'Active Collaborator',  icon: 'handshake',            description: '3+ confirmed meetings' },
  trusted_partner:     { label: 'Trusted Partner',      icon: 'verified',             description: '5+ completed collaborations' },
  community_helper:    { label: 'Community Helper',     icon: 'forum',                description: 'Posted 10+ comments' },
  profile_complete:    { label: 'Complete Profile',     icon: 'account_circle',       description: 'Profile fully filled out' },
  early_adopter:       { label: 'Early Adopter',        icon: 'rocket_launch',        description: 'Joined before June 2026' },
}
