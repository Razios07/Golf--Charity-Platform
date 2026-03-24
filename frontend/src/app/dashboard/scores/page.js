'use client'
import { useEffect, useState } from 'react'
import { getScores, addScore, updateScore, deleteScore } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, Loader2, Save, X, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { score: '', played_at: '', notes: '' }

export default function ScoresPage() {
  const [scores,  setScores]  = useState([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState(EMPTY)
  const [editing, setEditing] = useState(null) // score id being edited
  const [saving,  setSaving]  = useState(false)

  async function load() {
    const { scores } = await getScores()
    setScores(scores)
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await addScore(form)
      toast.success('Score added!')
      setForm(EMPTY)
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id) {
    setSaving(true)
    try {
      await updateScore(id, form)
      toast.success('Score updated!')
      setEditing(null)
      setForm(EMPTY)
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this score?')) return
    try {
      await deleteScore(id)
      toast.success('Score removed')
      await load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  function startEdit(s) {
    setEditing(s.id)
    setForm({ score: s.score, played_at: s.played_at, notes: s.notes || '' })
  }

  if (loading) return <div className="flex justify-center pt-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>

  return (
    <div className="space-y-8 stagger">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>My Scores</h1>
        <p className="text-neutral-500 text-sm mt-1">Your rolling 5 most recent Stableford scores (1–45). A new score replaces the oldest.</p>
      </div>

      {/* Info box */}
      <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-neutral-400">
          Only your latest <strong className="text-white">5 scores</strong> are kept. These are used for the monthly prize draw — match 3 or more of your scores to the drawn numbers to win.
        </p>
      </div>

      {/* Current scores */}
      <div className="card rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-white">Current Scores ({scores.length}/5)</h2>
        </div>

        {scores.length === 0 ? (
          <div className="p-10 text-center text-neutral-500 text-sm">No scores yet. Add your first score below.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {scores.map((s, i) => (
              <div key={s.id} className="p-4">
                {editing === s.id ? (
                  /* Edit inline */
                  <div className="flex flex-wrap items-center gap-3">
                    <input type="number" min="1" max="45" className="input-dark w-24" value={form.score} onChange={set('score')} />
                    <input type="date" className="input-dark w-44" value={form.played_at} onChange={set('played_at')} />
                    <input type="text" placeholder="Notes (optional)" className="input-dark flex-1" value={form.notes} onChange={set('notes')} />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(s.id)} disabled={saving} className="btn-primary py-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Save</>}
                      </button>
                      <button onClick={() => { setEditing(null); setForm(EMPTY) }} className="btn-ghost py-2">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display row */
                  <div className="flex items-center gap-4">
                    <div className={`score-ball ${i === 0 ? 'gold' : ''}`}>{s.score}</div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{formatDate(s.played_at)}</div>
                      {s.notes && <div className="text-neutral-500 text-xs">{s.notes}</div>}
                      {i === 0 && <div className="text-brand-400 text-xs mt-0.5">Most recent</div>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(s)} className="btn-ghost py-1.5 px-2 text-neutral-500 hover:text-white">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="btn-ghost py-1.5 px-2 text-neutral-500 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add score form */}
      {scores.length < 5 && !editing && (
        <div className="card rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Plus size={16} /> Add Score</h2>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5">Stableford Score (1–45)</label>
              <input type="number" min="1" max="45" className="input-dark w-32" placeholder="e.g. 38"
                value={form.score} onChange={set('score')} required />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5">Date Played</label>
              <input type="date" className="input-dark w-44"
                value={form.played_at} onChange={set('played_at')} required />
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-sm text-neutral-400 mb-1.5">Notes (optional)</label>
              <input type="text" className="input-dark" placeholder="e.g. Royal Troon — good round"
                value={form.notes} onChange={set('notes')} />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Add Score</>}
            </button>
          </form>
        </div>
      )}

      {scores.length >= 5 && !editing && (
        <p className="text-center text-neutral-500 text-sm">
          You have 5 scores. Adding a new one will replace the oldest automatically.
        </p>
      )}
    </div>
  )
}
