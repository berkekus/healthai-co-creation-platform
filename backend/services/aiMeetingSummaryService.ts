import Meeting from '../models/Meeting'
import Conversation from '../models/Conversation'
import Message from '../models/Message'
import { makeError } from '../utils/AppError'

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
const MAX_MESSAGES = 60

export interface MeetingSummaryResult {
  topics: string[]
  nextSteps: string[]
  openQuestions: string[]
  generatedAt: string
}

function parseSummary(text: string): Omit<MeetingSummaryResult, 'generatedAt'> | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      topics?: unknown
      nextSteps?: unknown
      openQuestions?: unknown
    }
    const toStringArray = (v: unknown) =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
    return {
      topics: toStringArray(parsed.topics),
      nextSteps: toStringArray(parsed.nextSteps),
      openQuestions: toStringArray(parsed.openQuestions),
    }
  } catch {
    return null
  }
}

export async function generateMeetingSummary(meetingId: string, userId: string): Promise<MeetingSummaryResult> {
  const meeting = await Meeting.findById(meetingId)
  if (!meeting) throw makeError('Meeting not found', 404)

  const isParticipant = meeting.requesterId.toString() === userId || meeting.ownerId.toString() === userId
  if (!isParticipant) throw makeError('Forbidden', 403)
  if (meeting.status !== 'completed') throw makeError('Meeting must be completed to generate a summary', 400)

  // Return cached summary if already generated
  if (meeting.aiSummary) {
    return {
      topics: meeting.aiSummary.topics,
      nextSteps: meeting.aiSummary.nextSteps,
      openQuestions: meeting.aiSummary.openQuestions,
      generatedAt: meeting.aiSummary.generatedAt.toISOString(),
    }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw makeError('Gemini API key is not configured', 503)

  const conversation = await Conversation.findOne({ meetingId })
  const messages = conversation
    ? await Message.find({ conversationId: conversation._id })
        .sort({ createdAt: 1 })
        .limit(MAX_MESSAGES)
        .lean()
    : []

  const transcript = messages.length > 0
    ? messages.map(m => `${m.senderName}: ${m.content}`).join('\n')
    : '(No messages were exchanged in this meeting)'

  const prompt = `You are summarizing a healthcare AI collaboration conversation.
Return ONLY valid JSON (no markdown) in this exact shape:
{
  "topics": ["key topic 1", "key topic 2", "key topic 3"],
  "nextSteps": ["action item 1", "action item 2"],
  "openQuestions": ["question 1", "question 2"]
}

Meeting: "${meeting.postTitle}"
Participants: ${meeting.requesterName} (requester) and ${meeting.ownerName} (post owner)

Conversation transcript:
${transcript.slice(0, 3000)}

Rules:
- topics: 2-4 main subjects discussed (short phrases, max 80 chars each)
- nextSteps: concrete agreed actions (start with a verb, max 100 chars each)
- openQuestions: unresolved points that need follow-up (max 100 chars each)
- If transcript is empty, infer from the meeting context what would typically be discussed
- Keep all arrays to 2-4 items maximum`

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    }),
  })

  if (response.status === 429) throw makeError('AI service is temporarily rate-limited. Please try again in a minute.', 429)
  if (!response.ok) throw makeError(`AI service error (${response.status}). Please try again later.`, 502)

  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const text = payload.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? ''
  const result = parseSummary(text)
  if (!result) throw makeError('Gemini returned an unexpected format', 502)

  const generatedAt = new Date()
  await Meeting.updateOne({ _id: meetingId }, {
    aiSummary: { ...result, generatedAt },
  })

  return { ...result, generatedAt: generatedAt.toISOString() }
}
