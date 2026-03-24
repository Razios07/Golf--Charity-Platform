'use client'
import { useEffect, useState } from 'react'
import { getWinners, updateWinner } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Medal, Upload, Loader2, Info, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WinningsPage() {
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(null) // winner id currently uploading
  const [proofUrl, setProofUrl] = useState('')

  useEffect(() => {
    getWinners()
      .then(r => setWinners(r.winners))
      .catch(() => toast.error('Failed to load winnings'))
      .finally(() => setLoading(false))
  }, [])

  async function handleProofSubmit(id) {
    if (!proofUrl.trim()) { toast.error('Please enter a screenshot URL'); return }
    try {
      const { winner } = await updateWinner(id, { proof_url: proofUrl })
      setWinners(ws => ws.map(w => w.id === id ? { ...w, ...winner } : w))
      setUploading(null)
      setProofUrl('')
      toast.success('Proof submitted! Awaiting admin review.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) return <div className="flex justify-center pt-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>

  const totalWon = winners.reduce((s, w) => s + w.prize_amount, 0)
  const paid = winners.filter(w => w.payment_status === 'paid')
  const pending = winners.filter(w => w.verification_status === 'pending')

  return (
    <div className="space-y-8 stagger">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Winnings</h1>
        <p className="text-neutral-500 text-sm mt-1">Your prize history and verification status.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Won',    value: formatCurrency(totalWon),   color: 'text-gold-400' },
          { label: 'Paid Out',     value: formatCurrency(paid.reduce((s, w) => s + w.prize_amount, 0)), color: 'text-brand-400' },
          { label: 'Pending',      value: pending.length,             color: 'text-yellow-400' },
        ].map((s, i) => (
          <div key={i} className="stat-card rounded-xl text-center">
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: 'var(--font-display)' }}>{s.value}</div>
            <div className="text-neutral-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* How verification works */}
      <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-neutral-400">
          When you win, upload a <strong className="text-white">screenshot of your scores</strong> from your golf club platform as proof. An admin will review and approve your prize within 48 hours.
        </p>
      </div>

      {/* Winners list */}
      {winners.length === 0 ? (
        <div className="card rounded-xl p-12 text-center">
          <Medal size={32} className="text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500">No winnings yet — enter draws to win!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {winners.map(w => (
            <div key={w.id} className="card rounded-xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${getStatusColor(w.verification_status)}`}>{w.verification_status}</span>
                      <span className={`badge ${getStatusColor(w.payment_status)}`}>{w.payment_status}</span>
                    </div>
                    <p className="text-white font-semibold">{w.match_type} — {w.draws?.month || '—'}</p>
                    <p className="text-neutral-500 text-xs mt-0.5">Won on {formatDate(w.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-gold-400 font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
                      {formatCurrency(w.prize_amount)}
                    </div>
                  </div>
                </div>

                {/* Proof upload — only if pending and no proof yet */}
                {w.verification_status === 'pending' && !w.proof_url && (
                  <div className="border-t border-white/5 pt-4">
                    {uploading === w.id ? (
                      <div className="flex gap-3">
                        <input
                          type="url"
                          className="input-dark flex-1"
                          placeholder="Paste screenshot URL (e.g. from Imgur, Google Drive)"
                          value={proofUrl}
                          onChange={e => setProofUrl(e.target.value)}
                        />
                        <button onClick={() => handleProofSubmit(w.id)} className="btn-primary">
                          <Check size={14} /> Submit
                        </button>
                        <button onClick={() => { setUploading(null); setProofUrl('') }} className="btn-ghost">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setUploading(w.id)} className="btn-secondary">
                        <Upload size={14} /> Upload Proof Screenshot
                      </button>
                    )}
                  </div>
                )}

                {/* Proof submitted */}
                {w.proof_url && w.verification_status === 'pending' && (
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-brand-400 text-sm flex items-center gap-2">
                      <Check size={14} /> Proof submitted — awaiting admin review
                    </p>
                  </div>
                )}

                {/* Admin notes on rejection */}
                {w.verification_status === 'rejected' && w.admin_notes && (
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-red-400 text-sm">Rejected: {w.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
