import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!, apiVersion: 'v1' })

const SYSTEM_PROMPT = `You are NEXORA's Civic AI Agent for Ahmedabad, India. Help citizens report civic issues like potholes, water leakages, broken streetlights, garbage, or stray animals.

Your job:
1. Greet the user and ask them to describe their issue
2. Ask ONE clarifying question at a time if needed (location, severity, how long)
3. Once you have enough info, output the form data

Rules:
- Keep responses short and friendly (2-3 sentences max)
- Ask about location if not mentioned
- When ready, end your message with exactly this block:

FORM_DATA:
{"title":"...","description":"...","category":"pothole|water_leakage|streetlight|garbage|stray_animals|other","severity":3,"suggested_authority":"Ahmedabad Municipal Corporation|PWD|Electricity Board|Water Board|Animal Control|Other"}

Only output FORM_DATA once when you have title, description, category, severity.`

interface Message {
    role: 'user' | 'model'
    parts: [{ text: string }]
}

export async function POST(request: NextRequest) {
    try {
        const { history, message } = await request.json() as {
            history: Message[]
            message: string
        }

        const contents = [
            { role: 'user', parts: [{ text: 'System instructions: ' + SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'Understood. I am the NEXORA Civic AI Agent, ready to help citizens of Ahmedabad report civic issues.' }] },
            ...history,
            { role: 'user', parts: [{ text: message }] },
        ]

        const result = await ai.models.generateContent({
            model: 'gemini-pro',
            contents,
            config: { temperature: 0.4, maxOutputTokens: 400 },
        })

        const text = result.text ?? ''
        let formData = null
        const formMatch = text.match(/FORM_DATA:\s*(\{[\s\S]*?\})/m)
        if (formMatch) {
            try { formData = JSON.parse(formMatch[1]) } catch { }
        }
        const displayText = text.replace(/FORM_DATA:[\s\S]*$/m, '').trim()

        return NextResponse.json({ text: displayText, formData, duplicate: null })
    } catch (err) {
        console.error('Agent error:', err)
        return NextResponse.json({ error: 'Agent failed' }, { status: 500 })
    }
}