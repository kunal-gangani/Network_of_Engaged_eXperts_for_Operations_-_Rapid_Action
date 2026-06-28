import { NextRequest, NextResponse } from 'next/server'
import { getCityFromCoords } from '@/lib/location'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') ?? '0')
    const lng = parseFloat(searchParams.get('lng') ?? '0')

    if (!lat || !lng) {
        return NextResponse.json({ display: 'Your location', city: 'Your city', authority: 'Municipal Corporation' })
    }

    const loc = await getCityFromCoords(lat, lng)
    return NextResponse.json(loc)
}