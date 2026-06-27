import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeminiVisionResult } from '@/types'

// Use global endpoint (no region) to avoid per-region quota limits on free tier
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const VISION_PROMPT = `You are a civic issue classifier for Indian cities. Analyze this image and return ONLY valid JSON with no markdown or extra text:
{
  "category": "pothole|water_leakage|streetlight|garbage|stray_animals|other",
  "severity": 1,
  "summary": "one-line description under 20 words",
  "suggested_authority": "Ahmedabad Municipal Corporation|PWD|Electricity Board|Water Board|Animal Control|Other"
}
severity must be an integer between 1 and 5.`

export async function categorizeIssueImage(
  imageBase64: string,
  mimeType: string
): Promise<GeminiVisionResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  })

  // Retry once on 429
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
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
      })

      const text = result.response.text()
      const parsed = JSON.parse(text) as GeminiVisionResult

      return {
        category: parsed.category ?? 'other',
        severity: Math.min(5, Math.max(1, Number(parsed.severity) || 3)),
        summary: parsed.summary ?? 'Civic issue reported',
        suggested_authority: parsed.suggested_authority ?? 'Ahmedabad Municipal Corporation',
      }
    } catch (err: any) {
      // On 429, wait 2s and retry once
      if (attempt === 0 && err?.status === 429) {
        await new Promise(r => setTimeout(r, 2000))
        continue
      }
      throw err
    }
  }

  // Fallback if both attempts fail
  return {
    category: 'other',
    severity: 3,
    summary: 'Unable to analyze image — please fill in details manually',
    suggested_authority: 'Ahmedabad Municipal Corporation',
  }
}