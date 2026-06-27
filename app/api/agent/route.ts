import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SYSTEM_PROMPT = `You are NEXORA's Civic AI Agent — a helpful assistant for citizens in Ahmedabad, India who want to report civic issues like potholes, water leakages, broken streetlights, garbage, or stray animals.

Your job:
1. Greet the user warmly and ask them to describe their issue
2. Ask ONE clarifying question at a time if needed (location, how long it's been there, severity)
3. Once you have enough info (issue type + rough location), output the form data

Rules:
- Keep responses short and conversational (2-3 sentences max)
- Be friendly and professional
- Ask about location if not mentioned
- When you have enough info, end your message with exactly this block:

FORM_DATA:
{
  "title": "...",
  "description": "...",
  "category": "pothole|water_leakage|streetlight|garbage|stray_animals|other",
  "severity": 1-5,
  "suggested_authority": "Ahmedabad Municipal Corporation|PWD|Electricity Board|Water Board|Animal Control|Other"
}

Only output FORM_DATA when you're confident you have title, description, category, and severity.
Never output FORM_DATA more than once.`

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

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: 'System instructions: ' + SYSTEM_PROMPT }] },
                { role: 'model', parts: [{ text: 'Understood. I am the NEXORA Civic AI Agent.' }] },
                ...history,
            ],
            generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
        })

        const result = await chat.sendMessage(message)
        const text = result.response.text()

        // Check if FORM_DATA is in the response
        let formData = null
        const formMatch = text.match(/FORM_DATA:\s*(\{[\s\S]*?\})/m)
        if (formMatch) {
            try {
                formData = JSON.parse(formMatch[1])
            } catch { }
        }

        // Clean response text — remove FORM_DATA block from display
        const displayText = text.replace(/FORM_DATA:[\s\S]*$/m, '').trim()

        // Check for duplicates if we have form data
        let duplicate = null
        if (formData) {
            try {
                const supabase = await createClient()
                const { data: recent } = await supabase
                    .from('issues')
                    .select('id, title, status, created_at')
                    .eq('category', formData.category)
                    .neq('status', 'resolved')
                    .order('created_at', { ascending: false })
                    .limit(3)

                if (recent && recent.length > 0) {
                    duplicate = recent[0]
                }
            } catch { }
        }

        return NextResponse.json({ text: displayText, formData, duplicate })
    } catch (err) {
        console.error('Agent error:', err)
        return NextResponse.json({ error: 'Agent failed' }, { status: 500 })
    }
}