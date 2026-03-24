'use client'
import { useEffect, useState } from 'react'
import { getDraws, getScores } from '@/lib/api'
import { formatMonth, formatCurrency } from '@/lib/utils'
import { Trophy, Loader2, Info } from 'lucide-react'
import toast from 'react-hot-toast'

function countMatches(userScores, winningNumbers) {
  return userScores.filter(s => winningNumbers.includes(s)).length
}

export default function DrawsPage() {
  const [draws,   setDraws]   = useState([])
  const [scores,  setScores]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDraws(), getScores()])
      .then(([d, s]) => { setDraws(d.draws); setScores(s.scores.map(sc => sc.score)) })
      .catch(() => toast.error('Failed to load draws'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center pt-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>

  const published = draws.filter(d => d.status === 'published')

  return (
    <div className="space-y-8 stagger">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Prize Draws</h1>
        <p className="text-neutral-500 text-sm mt-1">Monthly draws — match your scores to the winning numbers to win.</p>
      </div>

      {/* Your scores summary */}
      {scores.length > 0 && (
        <div className="card rounded-xl p-5">
          <h2 className="font-semibold text-white mb-3">Your Current Numbers</h2>
          <div className="flex flex-wrap gap-3">
            {scores.map((s, i) => (
              <div key={i} className="score-ball">{String(s).padStart(2, '0')}</div>
            ))}
          </div>
          <p className="text-neutral-500 text-xs mt-3">These are your latest 5 Stableford scores used in draws.</p>
        </div>
      )}

      {published.length === 0 ? (
        <div className="card rounded-xl p-10 text-center">
          <Trophy size={32} className="text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500">No draws published yet. Check back monthly!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {published.map(draw => {
            const matches = scores.length > 0 ? countMatches(scores, draw.winning_numbers) : null
            const matchColor = matches === 5 ? 'text-gold-400' : matches >= 3 ? 'text-brand-400' : 'text-neutral-500'

            return (
              <div key={draw.id} className="card rounded-xl overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">{formatMonth(draw.month)}</h3>
                    <p className="text-neutral-500 text-xs mt-0.5 capitalize">{draw.draw_type} draw</p>
                  </div>
                  {matches !== null && (
                    <div className="text-right">
                      <div className={`font-bold text-lg ${matchColor}`}>{matches} match{matches !== 1 ? 'es' : ''}</div>
                      {matches === 5 && <div className="text-gold-400 text-xs">🏆 Jackpot Winner!</div>}
                      {matches === 4 && <div className="text-brand-400 text-xs">🥇 Major Prize!</div>}
                      {matches === 3 && <div className="text-brand-400 text-xs">🥈 Prize!</div>}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="mb-4">
                    <p className="text-neutral-500 text-xs mb-3">Winning Numbers</p>
                    <div className="flex flex-wrap gap-3">
                      {draw.winning_numbers.map((n, i) => {
                        const isMatch = scores.includes(n)
                        return (
                          <div key={i} className={`score-ball ${isMatch ? 'gold' : ''}`}>
                            {String(n).padStart(2, '0')}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Prize pools */}
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
                    {[
                      { label: 'Jackpot (5✓)', amount: draw.jackpot_amount, rollover: draw.jackpot_rollover },
                      { label: '4 Match',      amount: draw.pool_4match },
                      { label: '3 Match',      amount: draw.pool_3match },
                    ].map((tier, i) => (
                      <div key={i} className="text-center">
                        <div className="text-white font-semibold text-sm">{formatCurrency(tier.amount)}</div>
                        <div className="text-neutral-500 text-xs">{tier.label}</div>
                        {tier.rollover && <div className="text-xs text-gold-500/70 mt-0.5">Rolled over</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
