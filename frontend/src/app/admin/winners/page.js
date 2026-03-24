'use client'
import { useEffect, useState } from 'react'
import { getAdminWinners, updateWinner } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Check, X, Loader2, Medal, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')  // all | pending | approved | rejected
  const [notes,   setNotes]   = useState({})      // { winnerId: note }
  const [saving,  setSaving]  = useState(null)

  useEffect(() => {
    getAdminWinners()
      .then(r => setWinners(r.winners))
      .catch(() => toast.error('Failed to load winners'))
      .finally(() => setLoading(false))
  }, [])

  async function handleVerify(id, status) {
    setSaving(id)
    try {
      const { winner } = await updateWinner(id, {
        verification_status: status,
        admin_notes: notes[id] || null,
      })
      setWinners(ws => ws.map(w => w.id === id ? { ...w, ...winner } : w))
      toast.success(status === 'approved' ? 'Prize approved!' : 'Submission rejected.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(null)
    }
  }

  async function handleMarkPaid(id) {
    setSaving(id)
    try {
      const { winner } = await updateWinner(id, { payment_status: 'paid' })
      setWinners(ws => ws.map(w => w.id === id ? { ...w, ...winner } : w))
      toast.success('Marked as paid!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(null)
    }
  }

  const filtered = winners.filter(w =>
    filter === 'all' || w.verification_status === filter
  )

  if (loading) return <div className="flex justify-center pt-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>

  const counts = {
    all: winners.length,
    pending:  winners.filter(w => w.verification_status === 'pending').length,
    approved: winners.filter(w => w.verification_status === 'approved').length,
    rejected: winners.filter(w => w.verification_status === 'rejected').length,
  }

  return (
    <div className="space-y-6 stagger">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Winners</h1>
        <p className="text-neutral-500 text-sm mt-1">Verify submissions and manage prize payouts.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(counts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all capitalize ${
              filter === key
                ? 'bg-brand-500/15 text-brand-400 border-brand-500/30'
                : 'text-neutral-400 border-white/10 hover:border-white/20'
            }`}>
            {key} <span className="text-xs opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card rounded-xl p-12 text-center">
          <Medal size={32} className="text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500">No winners in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(w => (
            <div key={w.id} className="card rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge border ${getStatusColor(w.verification_status)}`}>{w.verification_status}</span>
                    <span className={`badge border ${getStatusColor(w.payment_status)}`}>{w.payment_status}</span>
                    <span className="badge border text-purple-400 bg-purple-400/10 border-purple-400/20">{w.match_type}</span>
                  </div>
                  <p className="text-white font-medium">{w.profiles?.full_name || 'Unknown'}</p>
                  <p className="text-neutral-500 text-xs">{w.profiles?.email} · Draw: {w.draws?.month}</p>
                </div>
                <div className="text-right">
                  <div className="text-gold-400 font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatCurrency(w.prize_amount)}
                  </div>
                  <div className="text-neutral-500 text-xs">{formatDate(w.created_at)}</div>
                </div>
              </div>

              {/* Proof link */}
              {w.proof_url && (
                <div className="mb-4 p-3 bg-white/4 rounded-lg flex items-center justify-between">
                  <span className="text-neutral-400 text-sm">Proof submitted</span>
                  <a href={w.proof_url} target="_blank" rel="noopener noreferrer"
                    className="text-brand-400 text-sm flex items-center gap-1 hover:underline">
                    View <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {!w.proof_url && w.verification_status === 'pending' && (
                <div className="mb-4 p-3 bg-yellow-400/5 border border-yellow-400/15 rounded-lg">
                  <p className="text-yellow-400 text-xs">Waiting for user to upload proof screenshot.</p>
                </div>
              )}

              {/* Admin actions */}
              {w.verification_status === 'pending' && w.proof_url && (
                <div className="space-y-3 border-t border-white/5 pt-4">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Admin Notes (optional — shown to user on rejection)</label>
                    <input className="input-dark text-xs py-2" placeholder="Reason for rejection…"
                      value={notes[w.id] || ''}
                      onChange={e => setNotes(n => ({ ...n, [w.id]: e.target.value }))} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleVerify(w.id, 'approved')} disabled={saving === w.id} className="btn-primary">
                      {saving === w.id ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Approve</>}
                    </button>
                    <button onClick={() => handleVerify(w.id, 'rejected')} disabled={saving === w.id} className="btn-danger">
                      {saving === w.id ? <Loader2 size={14} className="animate-spin" /> : <><X size={14} /> Reject</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Mark paid */}
              {w.verification_status === 'approved' && w.payment_status === 'pending' && (
                <div className="border-t border-white/5 pt-4">
                  <button onClick={() => handleMarkPaid(w.id)} disabled={saving === w.id} className="btn-secondary">
                    {saving === w.id ? <Loader2 size={14} className="animate-spin" /> : '💸 Mark as Paid'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
