import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Topnav from '@/components/Topnav'
import { createClient } from '@/lib/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NEXORA — Civic Intelligence Platform',
  description: 'Network of Engaged eXperts for Operations & Rapid Action',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', background: '#141414' }}>
        <Topnav user={user} />
        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 40px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
