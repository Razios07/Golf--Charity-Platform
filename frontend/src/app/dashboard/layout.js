'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import { LayoutDashboard, Target, Heart, Trophy, Medal, LogOut, Settings, ShieldCheck, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/scores',   icon: Target,          label: 'My Scores' },
  { href: '/dashboard/charity',  icon: Heart,           label: 'My Charity' },
  { href: '/dashboard/draws',    icon: Trophy,          label: 'Draws' },
  { href: '/dashboard/winnings', icon: Medal,           label: 'Winnings' },
]

function Sidebar({ onClose }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { profile, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  return (
    <aside className="w-60 h-full flex flex-col bg-dark-800 border-r border-white/5">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/5">
        <Link href="/" className="text-brand-400 font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
          ⛳ GolfCharity
        </Link>
        {onClose && <button onClick={onClose} className="text-neutral-500 hover:text-white md:hidden"><X size={18} /></button>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                active ? 'bg-brand-500/15 text-brand-400 font-medium' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              )}>
              <item.icon size={16} />
              {item.label}
            </Link>
          )
        })}

        {profile?.role === 'admin' && (
          <>
            <div className="pt-4 pb-1 px-3 text-xs text-neutral-600 uppercase tracking-wider">Admin</div>
            <Link href="/admin" onClick={onClose}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                pathname.startsWith('/admin') ? 'bg-brand-500/15 text-brand-400 font-medium' : 'text-neutral-400 hover:text-white hover:bg-white/5')}>
              <ShieldCheck size={16} /> Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold">
            {profile?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{profile?.full_name || 'Golfer'}</div>
            <div className="text-xs text-neutral-500 truncate">{profile?.email}</div>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="btn-ghost w-full justify-start text-neutral-500 hover:text-red-400 mt-1">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  )
}

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-dark-900">
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-60 h-full"><Sidebar onClose={() => setMobileOpen(false)} /></div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden h-14 flex items-center gap-3 px-4 border-b border-white/5 bg-dark-800">
          <button onClick={() => setMobileOpen(true)} className="text-neutral-400 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="text-brand-400 font-bold" style={{ fontFamily: 'var(--font-display)' }}>⛳ GolfCharity</span>
        </div>

        <main className="flex-1 p-5 md:p-8 max-w-5xl w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
