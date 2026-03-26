'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthContext'
import { getMySubscription, getScores, getUserCharity, getDraws, getWinners } from '@/lib/api'
import { formatCurrency, formatDate, formatMonth, getStatusColor } from '@/lib/utils'
import { Target, Heart, Trophy, Medal, ChevronRight, AlertCircle, Loader2, ArrowUpRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { profile } = useAuth()
  const [data, setData]     = useState({ sub: null, scores: [], charity: null, draws: [], wins: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscription') === 'success') {
      toast.success('Subscription activated! Welcome to GolfCharity 🎉')
    }
  }, [])

  useEffect(() => {
    Promise.all([getMySubscription(), getScores(), getUserCharity(), getDraws(), getWinners()])
      .then(([s, sc, c, d, w]) => {
        setData({ sub: s.subscription, scores: sc.scores, charity: c.userCharity, draws: d.draws, wins: w.winners })
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-brand-500" />
    </div>
  )

  const { sub, scores, charity, draws, wins } = data
  const activeDraws = draws.filter(d => d.status === 'published').slice(0, 3)
  const pendingWins = wins.filter(w => w.verification_status === 'pending')

  return (
    <div className="space-y-8 stagger">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Golfer'} 👋
        </h1>
        <p className="text-neutral-500 mt-1">Here's everything happening with your account.</p>
      </div>

      {/* No subscription banner */}
      {!sub && (
        <div className="bg-gold-500/8 border border-gold-500/20 rounded-xl p-5 flex items-start gap-4">
          <AlertCircle className="text-gold-400 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-white font-medium">No active subscription</p>
            <p className="text-neutral-400 text-sm mt-0.5">Subscribe to enter scores, join draws, and support a charity.</p>
          </div>
          <Link href="/subscribe" className="btn-primary shrink-0">Subscribe</Link>
        </div>
      )}

      {/* Pending win banner */}
      {pendingWins.length > 0 && (
        <div className="bg-brand-500/8 border border-brand-500/20 rounded-xl p-5 flex items-start gap-4">
          <Medal className="text-brand-400 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-white font-medium">🎉 You have {pendingWins.length} unverified prize{pendingWins.length > 1 ? 's' : ''}!</p>
            <p className="text-neutral-400 text-sm mt-0.5">Upload your score screenshot to claim your winnings.</p>
          </div>
          <Link href="/dashboard/winnings" className="btn-primary shrink-0">Claim</Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
        {[
          {
            icon: <Target size={18} className="text-brand-400" />,
            label: 'Scores Logged', value: scores.length,
            sub: `/ 5 maximum`, href: '/dashboard/scores',
          },
          {
            icon: <Heart size={18} className="text-red-400" />,
            label: 'Charity %', value: charity ? `${charity.contribution_percent}%` : '—',
            sub: charity?.charity?.name || 'Not selected', href: '/dashboard/charity',
          },
          {
            icon: <Trophy size={18} className="text-gold-400" />,
            label: 'Draws Entered', value: activeDraws.length,
            sub: 'active draws', href: '/dashboard/draws',
          },
          {
            icon: <Medal size={18} className="text-blue-400" />,
            label: 'Total Won', value: formatCurrency(wins.reduce((s, w) => s + w.prize_amount, 0)),
            sub: `${wins.length} win${wins.length !== 1 ? 's' : ''}`, href: '/dashboard/winnings',
          },
        ].map((card, i) => (
          <Link key={i} href={card.href}
            className="stat-card card-hover rounded-xl group transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/5 rounded-lg">{card.icon}</div>
              <ArrowUpRight size={14} className="text-neutral-600 group-hover:text-neutral-400 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="text-xs text-neutral-500 mt-1">{card.label}</div>
            <div className="text-xs text-neutral-600 mt-0.5 truncate">{card.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Subscription status */}
        <div className="card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Subscription</h2>
            {sub && <Link href="/dashboard/subscription" className="text-xs text-brand-400 hover:underline">Manage</Link>}
          </div>
          {sub ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Plan</span>
                <span className="text-white text-sm capitalize font-medium">{sub.plan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Status</span>
                <span className={`badge ${getStatusColor(sub.status)}`}>{sub.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Renews</span>
                <span className="text-white text-sm">{formatDate(sub.current_period_end)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Amount</span>
                <span className="text-white text-sm font-medium">{formatCurrency(sub.amount)}</span>
              </div>
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">No subscription found.</p>
          )}
        </div>

        {/* Recent scores */}
        <div className="card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Scores</h2>
            <Link href="/dashboard/scores" className="text-xs text-brand-400 hover:underline">Manage</Link>
          </div>
          {scores.length > 0 ? (
            <div className="space-y-2">
              {scores.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`score-ball w-9 h-9 text-xs ${i === 0 ? 'gold' : ''}`}>{s.score}</div>
                    <span className="text-neutral-400 text-sm">{formatDate(s.played_at)}</span>
                  </div>
                  <span className="text-xs text-neutral-600">Stableford</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-neutral-500 text-sm mb-3">No scores yet.</p>
              <Link href="/dashboard/scores" className="btn-primary text-xs">Add Score</Link>
            </div>
          )}
        </div>
      </div>

      {/* Latest draw */}
      {activeDraws[0] && (
        <div className="card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Latest Draw — {formatMonth(activeDraws[0].month)}</h2>
            <Link href="/dashboard/draws" className="text-xs text-brand-400 hover:underline flex items-center gap-1">
              All draws <ChevronRight size={12} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {activeDraws[0].winning_numbers.map((n, i) => (
              <div key={i} className="score-ball gold">{String(n).padStart(2, '0')}</div>
            ))}
          </div>
          <p className="text-neutral-500 text-xs mt-3">
            Match 3, 4, or 5 of these numbers with your Stableford scores to win.
          </p>
        </div>
      )}
    </div>
  )
}
