import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeminiVisionResult } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const VISION_PROMPT = `You are a civic issue classifier for Indian cities. Analyze this image and return ONLY valid JSON with no markdown or explanation:
{
  "category": "pothole|water_leakage|streetlight|garbage|stray_animals|other",
  "severity": 1-5,
  "summary": "one-line description under 20 words",
  "suggested_authority": "Municipal Corporation|PWD|Electricity Board|Water Board|Animal Control|Other"
}`

export async function categorizeIssueImage(
  imageBase64: string,
  mimeType: string
): Promise<GeminiVisionResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: VISION_PROMPT },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  })

  const text = result.response.text()
  const parsed = JSON.parse(text) as GeminiVisionResult

  return {
    category: parsed.category ?? 'other',
    severity: Math.min(5, Math.max(1, Number(parsed.severity) || 3)),
    summary: parsed.summary ?? 'Civic issue reported',
    suggested_authority: parsed.suggested_authority ?? 'Municipal Corporation',
  }
}
