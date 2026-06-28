// Reverse geocode using OpenStreetMap Nominatim (free, no API key)
export async function getCityFromCoords(lat: number, lng: number): Promise<{
    city: string
    state: string
    country: string
    authority: string
    display: string
}> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'User-Agent': 'NEXORA-CivicPlatform/1.0' } }
        )
        const data = await res.json()
        const addr = data.address ?? {}

        const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? 'Your city'
        const state = addr.state ?? ''
        const country = addr.country ?? 'India'

        // Derive municipal authority from city
        const authority = getMunicipalAuthority(city, state)

        return {
            city,
            state,
            country,
            authority,
            display: [city, state].filter(Boolean).join(', '),
        }
    } catch {
        return {
            city: 'Your city',
            state: '',
            country: 'India',
            authority: 'Municipal Corporation',
            display: 'Your location',
        }
    }
}

// Map known Indian cities to their municipal bodies
function getMunicipalAuthority(city: string, state: string): string {
    const c = city.toLowerCase()
    const s = state.toLowerCase()

    if (c.includes('ahmedabad') || c.includes('ahmadabad')) return 'Ahmedabad Municipal Corporation (AMC)'
    if (c.includes('surat')) return 'Surat Municipal Corporation (SMC)'
    if (c.includes('vadodara') || c.includes('baroda')) return 'Vadodara Municipal Corporation (VMC)'
    if (c.includes('rajkot')) return 'Rajkot Municipal Corporation (RMC)'
    if (c.includes('mumbai') || c.includes('bombay')) return 'Brihanmumbai Municipal Corporation (BMC)'
    if (c.includes('pune')) return 'Pune Municipal Corporation (PMC)'
    if (c.includes('nagpur')) return 'Nagpur Municipal Corporation (NMC)'
    if (c.includes('delhi') || c.includes('new delhi')) return 'Municipal Corporation of Delhi (MCD)'
    if (c.includes('bengaluru') || c.includes('bangalore')) return 'Bruhat Bengaluru Mahanagara Palike (BBMP)'
    if (c.includes('chennai')) return 'Greater Chennai Corporation (GCC)'
    if (c.includes('hyderabad')) return 'Greater Hyderabad Municipal Corporation (GHMC)'
    if (c.includes('kolkata')) return 'Kolkata Municipal Corporation (KMC)'
    if (c.includes('jaipur')) return 'Jaipur Municipal Corporation (JMC)'
    if (c.includes('lucknow')) return 'Lucknow Municipal Corporation (LMC)'
    if (c.includes('kanpur')) return 'Kanpur Municipal Corporation (KMC)'
    if (c.includes('indore')) return 'Indore Municipal Corporation (IMC)'
    if (c.includes('bhopal')) return 'Bhopal Municipal Corporation (BMC)'
    if (c.includes('patna')) return 'Patna Municipal Corporation (PMC)'
    if (c.includes('chandigarh')) return 'Chandigarh Municipal Corporation (CMC)'

    // Fallback — derive from state
    if (s.includes('gujarat')) return 'Gujarat Municipal Corporation'
    if (s.includes('maharashtra')) return 'Maharashtra Municipal Corporation'
    if (s.includes('karnataka')) return 'Karnataka Municipal Corporation'
    if (s.includes('tamil')) return 'Tamil Nadu Municipal Corporation'

    return `${city} Municipal Corporation`
}