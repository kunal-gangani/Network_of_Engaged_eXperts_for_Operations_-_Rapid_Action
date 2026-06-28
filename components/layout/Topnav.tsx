'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, LogOut, LogIn, Plus, Menu, X, LayoutDashboard, AlertTriangle, Bot } from 'lucide-react'

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/issues',    label: 'Issues',    icon: AlertTriangle   },
  { href: '/agents',    label: 'Agents',    icon: Bot             },
]

interface TopnavProps {
  user: { email?: string } | null
}

export default function Topnav({ user }: TopnavProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const signOut = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/login')
    router.refresh()
  }

  const close = () => setOpen(false)

  return (
    <>
      <header className="sticky top-0 z-50 border-b" style={{ background: '#1C1C1C', borderColor: '#2E2E2E' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 no-underline shrink-0" onClick={close}>
            <div className="w-7 h-7 flex items-center justify-center shrink-0" style={{
              background: '#E8621A',
              clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
            }}>
              <MapPin size={13} color="#fff" />
            </div>
            <div className="hidden xs:block">
              <p className="m-0 text-xs font-semibold text-white tracking-widest">NEXORA</p>
              <p className="m-0 text-[8px] tracking-wide" style={{ color: '#555' }}>CIVIC INTELLIGENCE</p>
            </div>
            <span className="xs:hidden text-sm font-semibold text-white tracking-widest">NEXORA</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link key={href} href={href} className="px-4 py-1.5 text-xs no-underline transition-all"
                  style={{
                    color: active ? '#fff' : '#888',
                    borderBottom: active ? '2px solid #E8621A' : '2px solid transparent',
                  }}>
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right — desktop actions + hamburger */}
          <div className="flex items-center gap-2">
            {/* Desktop actions */}
            {user ? (
              <>
                <Link href="/report" className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium text-white no-underline" style={{ background: '#E8621A' }}>
                  <Plus size={13} /> Report issue
                </Link>
                <Link href="/report" className="sm:hidden flex items-center justify-center w-9 h-9 rounded-md text-white" style={{ background: '#E8621A' }} aria-label="Report issue">
                  <Plus size={16} />
                </Link>
                <button onClick={signOut} className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-md text-xs cursor-pointer border"
                  style={{ background: 'transparent', borderColor: '#2E2E2E', color: '#888' }}
                  aria-label="Sign out">
                  <LogOut size={13} />
                </button>
              </>
            ) : (
              <Link href="/login" className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium text-white no-underline" style={{ background: '#E8621A' }}>
                <LogIn size={13} /> Sign in
              </Link>
            )}

            {/* Hamburger — shown on mobile/tablet */}
            <button
              onClick={() => setOpen(v => !v)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-md border cursor-pointer"
              style={{ background: 'transparent', borderColor: '#2E2E2E', color: '#888' }}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-14 right-0 bottom-0 z-50 md:hidden flex flex-col transition-transform duration-200 ease-in-out w-72 max-w-[85vw]`}
        style={{
          background: '#1C1C1C',
          borderLeft: '1px solid #2E2E2E',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Nav links */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} onClick={close}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm no-underline transition-colors min-h-[44px]"
                style={{
                  background: active ? '#E8621A1A' : 'transparent',
                  color: active ? '#E8621A' : '#888',
                  borderLeft: active ? '2px solid #E8621A' : '2px solid transparent',
                }}>
                <Icon size={16} className="shrink-0" />
                {label}
              </Link>
            )
          })}

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2E2E2E' }}>
            {user ? (
              <>
                <Link href="/report" onClick={close}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white no-underline min-h-[44px] mb-2"
                  style={{ background: '#E8621A' }}>
                  <Plus size={16} /> Report issue
                </Link>
                <button onClick={signOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm cursor-pointer border min-h-[44px]"
                  style={{ background: 'transparent', borderColor: '#2E2E2E', color: '#888' }}>
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <Link href="/login" onClick={close}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white no-underline min-h-[44px]"
                style={{ background: '#E8621A' }}>
                <LogIn size={16} /> Sign in
              </Link>
            )}
          </div>
        </nav>

        {/* User info at bottom */}
        {user && (
          <div className="p-4 border-t" style={{ borderColor: '#2E2E2E' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: '#E8621A33', border: '1px solid #E8621A55' }}>
                {user.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate m-0">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] truncate m-0" style={{ color: '#555' }}>{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
