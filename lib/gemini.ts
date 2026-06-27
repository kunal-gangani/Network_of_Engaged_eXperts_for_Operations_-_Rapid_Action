import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeminiVisionResult } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const VISION_PROMPT = `You are a civic issue classifier for Indian cities. Analyze this image and return ONLY valid JSON with no markdown:
{
  "category": "pothole|water_leakage|streetlight|garbage|stray_animals|other",
  "severity": 3,
  "summary": "one-line description under 20 words",
  "suggested_authority": "Ahmedabad Municipal Corporation|PWD|Electricity Board|Water Board|Animal Control|Other"
}
severity must be an integer 1-5.`

export async function categorizeIssueImage(
  imageBase64: string,
  mimeType: string
): Promise<GeminiVisionResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  })

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: VISION_PROMPT },
          ],
        }],
      })
      const parsed = JSON.parse(result.response.text()) as GeminiVisionResult
      return {
        category: parsed.category ?? 'other',
        severity: Math.min(5, Math.max(1, Number(parsed.severity) || 3)),
        summary: parsed.summary ?? 'Civic issue reported',
        suggested_authority: parsed.suggested_authority ?? 'Ahmedabad Municipal Corporation',
      }
    } catch (err: any) {
      if (attempt === 0 && err?.status === 429) {
        await new Promise(r => setTimeout(r, 3000))
        continue
      }
      throw err
    }
  }

  return { category: 'other', severity: 3, summary: 'Could not analyze — fill in manually', suggested_authority: 'Ahmedabad Municipal Corporation' }
}

export function getModel(name = 'gemini-1.5-flash') {
  return genAI.getGenerativeModel({ model: name })
}