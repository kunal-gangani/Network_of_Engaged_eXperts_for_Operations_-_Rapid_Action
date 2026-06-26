'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  MapPin, LayoutDashboard, AlertTriangle,
  Plus, LogOut, LogIn, Bot, ChevronRight
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/issues',    icon: AlertTriangle,   label: 'Issues'    },
  { href: '/report',    icon: Plus,            label: 'Report'    },
  { href: '/agents',    icon: Bot,             label: 'Agents'    },
]

const AGENTS = [
  { label: 'Vision Analyzer',    dot: '#3B7EF6' },
  { label: 'Duplicate Detector', dot: '#7C3AED' },
  { label: 'Decay & Risk',       dot: '#D97706' },
  { label: 'Resolution Planner', dot: '#16A34A' },
  { label: 'RTI Escalation',     dot: '#DC2626' },
]

interface SidebarProps {
  user: { email?: string } | null
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="flex flex-col w-56 shrink-0 h-screen"
      style={{ background: '#0F1729', borderRight: '1px solid #1E2D4A' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: '#1E2D4A' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#3B7EF6' }}>
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-widest">NEXORA</p>
            <p className="text-xs" style={{ color: '#4A6080', fontSize: '9px', letterSpacing: '0.05em' }}>CIVIC INTELLIGENCE</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-xs font-semibold px-2 mb-3 tracking-widest" style={{ color: '#2D4266', fontSize: '10px' }}>PLATFORM</p>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: active ? '#162038' : 'transparent', color: active ? '#FFFFFF' : '#8A9DC0' }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-40" />}
            </Link>
          )
        })}

        <div className="pt-4">
          <p className="text-xs font-semibold px-2 mb-3 tracking-widest" style={{ color: '#2D4266', fontSize: '10px' }}>AI AGENTS</p>
          {AGENTS.map(({ label, dot }) => (
            <div key={label} className="flex items-center gap-2.5 px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
              <span className="text-xs" style={{ color: '#4A6080' }}>{label}</span>
            </div>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t" style={{ borderColor: '#1E2D4A' }}>
        {user ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#3B7EF6' }}>
                {user.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user.email?.split('@')[0]}</p>
                <p className="text-xs truncate" style={{ color: '#4A6080' }}>{user.email}</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors" style={{ color: '#8A9DC0' }}>
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        ) : (
          <Link href="/login" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm" style={{ color: '#8A9DC0' }}>
            <LogIn className="w-4 h-4" />
            Sign in
          </Link>
        )}
      </div>
    </aside>
  )
}
