import i18n from './index'

/**
 * The API answers in English. These are the messages a person can actually run
 * into, mapped to `apiErrors.*` keys so they read in the interface language.
 * Anything not listed is shown as sent, so a new server message still appears
 * (in English) until it is added here.
 */
const EXACT: Record<string, string> = {
  'Network Error': 'network',
  'Too many requests, please try again later': 'tooManyRequests',
  'Invalid credentials': 'invalidCredentials',
  'Account suspended': 'accountSuspended',
  'Email not verified. Please check your inbox or request a new verification link.': 'emailNotVerified',
  'Email already registered': 'emailAlreadyRegistered',
  'Account is already verified': 'alreadyVerified',
  'This email address is already verified': 'alreadyVerified',
  'This verification link is invalid or has expired': 'verifyLinkInvalid',
  'Invalid or expired verification token': 'verifyLinkInvalid',
  'Verification token is required': 'verifyLinkInvalid',
  'Invalid or expired password reset token': 'resetLinkInvalid',
  'token and newPassword are required': 'resetLinkInvalid',
  'Human verification failed. Please try again.': 'humanVerificationFailed',
  'Email is required': 'emailRequired',
  'Email and password are required': 'emailPasswordRequired',
  'Invalid email format': 'invalidEmail',
  'Password must be at least 8 characters': 'passwordMin',
  'Current password is incorrect': 'currentPasswordIncorrect',
  'Incorrect password': 'incorrectPassword',
  'Session expired. Please sign in again.': 'sessionExpired',
  'Invalid or expired token': 'sessionExpired',
  'Not authenticated': 'sessionExpired',
  'This email domain does not appear to exist. Please check the address for typos.': 'emailDomainInvalid',
  'Only institutional .edu or .gov email addresses are accepted. Personal email providers are not permitted.': 'institutionalOnly',
  'Name must be at least 2 characters': 'nameMin',
  'name is required': 'nameMin',
  'Forbidden': 'forbidden',
  'Admin access required': 'forbidden',
  'User not found': 'userNotFound',
  'Post not found': 'postNotFound',
  'Meeting not found': 'meetingNotFound',
  'Comment not found': 'commentNotFound',
  'The comment you are replying to does not exist': 'commentNotFound',
  'Conversation not found': 'conversationNotFound',
  'Notification not found': 'notificationNotFound',
  'Saved search not found': 'savedSearchNotFound',
  'Maximum 20 saved searches allowed': 'savedSearchLimit',
  'Admins cannot create posts': 'adminsCannotPost',
  'All post fields are required': 'requiredFields',
  'All fields are required': 'requiredFields',
  'expiryDate must be a valid future date': 'expiryFuture',
  'Choose at least one domain': 'chooseDomain',
  'Each domain must be a non-empty name': 'domainInvalid',
  'Domain names must be 80 characters or fewer': 'domainInvalid',
  'This post has expired. Choose a new expiry date to reopen it.': 'postExpiredReopen',
  'Only a post marked as Partner Found can be reopened': 'reopenNotAllowed',
  'Only a published post can be marked as Partner Found': 'partnerFoundNotAllowed',
  'Post is not accepting interest': 'postClosed',
  'This post is not accepting meeting requests': 'postClosed',
  'Cannot express interest in your own post': 'ownPost',
  'You cannot request a meeting on your own post': 'ownPost',
  'You already have an open meeting request for this post': 'openRequestExists',
  'NDA must be accepted': 'ndaRequired',
  'Message must be at least 20 characters': 'messageMin',
  'Message cannot be empty': 'contentRequired',
  'Content is required': 'contentRequired',
  'content is required': 'contentRequired',
  'text is required': 'contentRequired',
  'Comment too long (max 500 characters)': 'commentTooLong',
  'Propose at least one time slot': 'slotsRequired',
  'Proposed time slots must be in the future': 'slotsFuture',
  'Proposed time slots must be unique': 'slotsUnique',
  'Each proposed time slot must include a valid date and time': 'slotsInvalid',
  'Each proposed time slot must use a valid time zone': 'slotsInvalid',
  'Each slot must have date (YYYY-MM-DD) and time (HH:MM)': 'slotsInvalid',
  'Propose 1 to 5 valid slots (date YYYY-MM-DD, time HH:MM)': 'slotsInvalid',
  'A confirmed slot with date (YYYY-MM-DD) and time (HH:MM) is required': 'confirmedSlotInvalid',
  'Confirmed slot must be one of the proposed slots': 'confirmedSlotInvalid',
  'One of the participants already has a confirmed meeting at this time slot': 'slotConflict',
  'Meeting must be completed to generate a summary': 'summaryNeedsHeld',
  'AI service is temporarily rate-limited. Please try again in a minute.': 'aiRateLimited',
  'Gemini API key is not configured': 'aiError',
  'Gemini request timed out': 'aiError',
  'Gemini returned an unexpected format': 'aiError',
  'At least title or description is required': 'aiNeedsText',
  'No image file provided': 'noImage',
  'Contact email is not a valid email address': 'contactEmailInvalid',
  'Enter a valid ORCID iD, e.g. 0000-0002-1825-0097': 'orcidInvalid',
  'Institution website must be a web address starting with https://': 'websiteInvalid',
  'LinkedIn link must point to linkedin.com': 'linkedinInvalid',
  'Cannot delete another admin account': 'cannotDeleteAdmin',
  'Account could not be deleted. Please try again.': 'accountDeleteFailed',
}

/** Messages with a number or name in them; the capture becomes the interpolation value. */
const PATTERNS: [RegExp, string, (match: RegExpMatchArray) => Record<string, string>][] = [
  [/^timeout of \d+ms exceeded$/, 'timeout', () => ({})],
  [/^Choose no more than (\d+) domains$/, 'tooManyDomains', m => ({ max: m[1] })],
  [/^Message must be no more than (\d+) characters$/, 'messageTooLong', m => ({ max: m[1] })],
  [/^Message too long \(max (\d+) characters\)$/, 'messageTooLong', m => ({ max: m[1] })],
  [/^Propose no more than (\d+) time slots$/, 'slotsMax', m => ({ max: m[1] })],
  [/^Cannot \w+ a meeting with status: \w+$/, 'meetingStatusChanged', () => ({})],
  [/^AI service error \(\d+\)/, 'aiError', () => ({})],
  [/^Gemini \d+/, 'aiError', () => ({})],
  [/^.+ (is too long|must be text)$/, 'fieldInvalid', () => ({})],
  [/^(.+) sign-in is not configured on this server\.$/, 'providerNotConfigured', m => ({ provider: m[1] })],
]

/** Every `apiErrors.*` key used above, so a test can check each locale has them. */
export const API_ERROR_KEYS = [...new Set([...Object.values(EXACT), ...PATTERNS.map(([, key]) => key)])]

export function translateApiMessage(message: string): string {
  const key = EXACT[message]
  if (key) return i18n.t(`apiErrors.${key}`)
  for (const [pattern, patternKey, params] of PATTERNS) {
    const match = message.match(pattern)
    if (match) return i18n.t(`apiErrors.${patternKey}`, params(match))
  }
  return message
}
