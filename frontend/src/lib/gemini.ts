import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Post } from '../types/post.types'
import type { User } from '../types/auth.types'

// Initialize Gemini with API key from environment
const getGenAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not defined in environment variables')
  }
  return new GoogleGenerativeAI(apiKey)
}

export interface AIMatchSuggestion {
  reason: string
  score: number
  expertise: string[]
}

/**
 * Analyze a project description and user expertise to find semantic matches
 */
export async function analyzeProjectMatch(
  postDescription: string,
  userExpertise: string[],
): Promise<AIMatchSuggestion | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const genAI = getGenAI()
    const model = genAI.getModel('gemini-2.0-flash-latest')

    const prompt = `
You are a medical AI matching expert. Analyze this project and user expertise to find semantic matches.

Project Description: ${postDescription}

User Expertise Tags: ${userExpertise.join(', ')}

Respond ONLY with a JSON object in this exact format:
{
  "reason": "A short explanation of why this matches (max 50 chars)",
  "score": number between 0-100,
  "expertise": ["relevant expertise areas found in the project"]
}

If no meaningful match, respond with: {"reason": "", "score": 0, "expertise": []}
`

    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return null
  } catch (error) {
    console.error('Gemini API error:', error)
    return null
  }
}

/**
 * Get smart suggestions for a user based on their profile and all posts
 */
export async function getSmartSuggestions(
  user: User,
  posts: Post[],
): Promise<Map<string, AIMatchSuggestion>> {
  const suggestions = new Map<string, AIMatchSuggestion>()
  
  if (!user.expertiseTags?.length) return suggestions

  // Process posts in batches to avoid rate limiting
  const batchSize = 5
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async (post) => {
        if (post.authorId === user.id) return // Skip own posts
        
        const result = await analyzeProjectMatch(
          `${post.title}. ${post.description}. ${post.expertiseRequired}`,
          user.expertiseTags || []
        )
        
        if (result && result.score > 30) {
          suggestions.set(post.id, result)
        }
      })
    )
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < posts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return suggestions
}

/**
 * Get a simple match score without API call (fallback)
 */
export function getSimpleMatchScore(post: Post, user: User): number {
  if (!user.expertiseTags?.length) return 0

  const postText = `${post.title} ${post.description} ${post.expertiseRequired} ${post.domain}`.toLowerCase()
  let matchCount = 0

  user.expertiseTags.forEach(tag => {
    if (postText.includes(tag.toLowerCase())) {
      matchCount++
    }
  })

  return Math.min(100, matchCount * 25)
}