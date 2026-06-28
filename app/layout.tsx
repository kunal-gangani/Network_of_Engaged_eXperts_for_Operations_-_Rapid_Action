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
      <body className="min-h-screen bg-[#141414] text-white">
        <Topnav user={user} />
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
          {children}
        </main>
      </body>
    </html>
  )
}
