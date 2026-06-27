import { GoogleGenAI } from '@google/genai'
import { GeminiVisionResult } from '@/types'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!, apiVersion: 'v1' })

const VISION_PROMPT = `You are a civic issue classifier for Indian cities. Analyze this image and return ONLY valid JSON with no markdown, no code blocks, no extra text whatsoever:
{"category":"pothole","severity":3,"summary":"one-line description under 20 words","suggested_authority":"Ahmedabad Municipal Corporation"}
category must be one of: pothole, water_leakage, streetlight, garbage, stray_animals, other
severity must be integer 1-5
suggested_authority must be one of: Ahmedabad Municipal Corporation, PWD, Electricity Board, Water Board, Animal Control, Other`

export async function categorizeIssueImage(
  imageBase64: string,
  mimeType: string
): Promise<GeminiVisionResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-pro-vision',
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: VISION_PROMPT },
          ],
        }],
      })

      const text = (result.text ?? '').trim()
      // Strip any markdown code blocks if present
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(clean) as GeminiVisionResult
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

export { ai }