import { NextRequest, NextResponse } from 'next/server'

// DEMO MODE: Scripted civic agent conversation
interface Message { role: 'user' | 'model'; parts: [{ text: string }] }

const RESPONSES = [
    {
        match: ['hi', 'hello', 'hey', 'start', 'help'],
        text: "Hi! I'm NEXORA's Civic AI Agent. Tell me what issue you've spotted in your area — describe what you see and roughly where it is.",
    },
    {
        match: ['pothole', 'road', 'broken', 'crack', 'damaged'],
        text: "Got it — sounds like a road infrastructure issue. How severe is it? Is it a small crack or a large pothole that's causing traffic problems?",
        form: { title: 'Road pothole causing vehicle damage', description: 'Large pothole on the main road causing vehicle damage and traffic disruption. Needs urgent repair.', category: 'pothole', severity: 4, suggested_authority: 'Ahmedabad Municipal Corporation' },
    },
    {
        match: ['water', 'leak', 'pipe', 'flood', 'overflow'],
        text: "Water leakage can be serious — it wastes resources and damages roads. Is this a pipe on the street or inside a building? And which area roughly?",
        form: { title: 'Water pipe leakage causing road flooding', description: 'Burst water pipe causing flooding on the road. Water wastage and road damage observed.', category: 'water_leakage', severity: 3, suggested_authority: 'Water Board' },
    },
    {
        match: ['light', 'streetlight', 'dark', 'lamp'],
        text: "A broken streetlight is a safety issue, especially at night. How many lights are out and which road is this on?",
        form: { title: 'Broken streetlight creating safety hazard', description: 'Streetlight not functioning, creating unsafe conditions for pedestrians and motorists at night.', category: 'streetlight', severity: 3, suggested_authority: 'Electricity Board' },
    },
    {
        match: ['garbage', 'waste', 'trash', 'dump', 'smell'],
        text: "Garbage dumping is a health hazard. Is this a regular dumping spot or a one-time incident? Which area?",
        form: { title: 'Illegal garbage dumping near residential area', description: 'Large amounts of garbage dumped near residential area causing health hazard and foul smell.', category: 'garbage', severity: 4, suggested_authority: 'Ahmedabad Municipal Corporation' },
    },
    {
        match: ['sg highway', 'navrangpura', 'satellite', 'cg road', 'bodakdev', 'iscon', 'ahmedabad'],
        text: "Thanks for the location! I've filled in the report form on the right with all the details. Review it and hit Submit when ready.",
        useLastForm: true,
    },
    {
        match: ['severe', 'bad', 'urgent', 'serious', 'large', 'big'],
        text: "Noted — marked as high severity. I've updated the form. Please verify the location using the button on the right and submit.",
        useLastForm: true,
    },
]

const DEFAULT_RESPONSES = [
    "Can you tell me more about where exactly this is located in Ahmedabad?",
    "Got it. And how long has this issue been there approximately?",
    "Thanks! I've pre-filled the form based on what you've described. Please add your location and submit.",
]

export async function POST(request: NextRequest) {
    await new Promise(r => setTimeout(r, 800))

    const { history, message } = await request.json() as { history: Message[]; message: string }
    const lower = message.toLowerCase()

    // Find matching response
    let matched = RESPONSES.find(r => r.match.some(keyword => lower.includes(keyword)))

    // If using last form, get the last form data from a previous match
    let formData = null
    if (matched) {
        if ('form' in matched) {
            formData = matched.form
        } else if ('useLastForm' in matched) {
            // Find last form in history context
            formData = { title: 'Civic issue reported via AI Agent', description: message, category: 'other', severity: 3, suggested_authority: 'Ahmedabad Municipal Corporation' }
        }
    }

    const turnCount = history.length
    const text = matched
        ? matched.text
        : DEFAULT_RESPONSES[Math.min(turnCount, DEFAULT_RESPONSES.length - 1)]

    // After 3 turns always offer to fill form
    const autoForm = !formData && turnCount >= 4
        ? { title: `Civic issue: ${message.slice(0, 50)}`, description: message, category: 'other' as const, severity: 3, suggested_authority: 'Ahmedabad Municipal Corporation' }
        : null

    return NextResponse.json({
        text: autoForm
            ? "I have enough information to file this report. I've pre-filled the form — please verify the location and submit!"
            : text,
        formData: formData ?? autoForm,
        duplicate: null,
    })
}