'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, LogOut, LogIn, Plus } from 'lucide-react'

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/issues',    label: 'Issues'    },
  { href: '/agents',    label: 'Agents'    },
]

interface TopnavProps {
  user: { email?: string } | null
}

export default function Topnav({ user }: TopnavProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header style={{
      background: '#1C1C1C',
      borderBottom: '1px solid #2E2E2E',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '30px', height: '30px',
            background: '#E8621A',
            clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MapPin size={14} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff', letterSpacing: '2px' }}>NEXORA</p>
            <p style={{ margin: 0, fontSize: '8px', color: '#555', letterSpacing: '0.5px' }}>CIVIC INTELLIGENCE</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} style={{
                padding: '6px 16px',
                fontSize: '12px',
                color: active ? '#fff' : '#888',
                textDecoration: 'none',
                borderBottom: active ? '2px solid #E8621A' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user ? (
            <>
              <Link href="/report" style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#E8621A', color: '#fff',
                padding: '7px 16px', borderRadius: '6px',
                fontSize: '12px', fontWeight: 500, textDecoration: 'none',
              }}>
                <Plus size={13} />
                Report issue
              </Link>
              <button onClick={signOut} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'transparent', border: '1px solid #2E2E2E',
                color: '#888', padding: '7px 12px',
                borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
              }}>
                <LogOut size={13} />
              </button>
            </>
          ) : (
            <Link href="/login" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#E8621A', color: '#fff',
              padding: '7px 16px', borderRadius: '6px',
              fontSize: '12px', fontWeight: 500, textDecoration: 'none',
            }}>
              <LogIn size={13} />
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
