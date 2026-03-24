'use client'
import { useEffect, useState } from 'react'
import { getCharities, getUserCharity, setUserCharity } from '@/lib/api'
import { Heart, Search, Check, Loader2, ExternalLink, Calendar } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CharityPage() {
  const [charities, setCharities] = useState([])
  const [current,   setCurrent]   = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [percent,   setPercent]   = useState(10)
  const [search,    setSearch]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    Promise.all([getCharities(), getUserCharity()])
      .then(([c, uc]) => {
        setCharities(c.charities)
        if (uc.userCharity) {
          setCurrent(uc.userCharity)
          setSelected(uc.userCharity.charity_id)
          setPercent(uc.userCharity.contribution_percent)
        }
      })
      .catch(() => toast.error('Failed to load charities'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!selected) { toast.error('Please select a charity'); return }
    setSaving(true)
    try {
      const { userCharity } = await setUserCharity({ charity_id: selected, contribution_percent: percent })
      setCurrent(userCharity)
      toast.success('Charity selection saved!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = charities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="flex justify-center pt-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>

  return (
    <div className="space-y-8 stagger">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>My Charity</h1>
        <p className="text-neutral-500 text-sm mt-1">Choose who benefits from your subscription. At least 10% goes to your chosen charity every month.</p>
      </div>

      {/* Current selection */}
      {current?.charity && (
        <div className="bg-brand-500/8 border border-brand-500/20 rounded-xl p-5 flex items-start gap-4">
          <Heart size={20} className="text-brand-400 shrink-0 mt-0.5" fill="currentColor" />
          <div>
            <p className="text-white font-medium">{current.charity.name}</p>
            <p className="text-neutral-400 text-sm mt-0.5">
              You contribute <strong className="text-brand-400">{current.contribution_percent}%</strong> of your subscription to this charity each month.
            </p>
          </div>
        </div>
      )}

      {/* Contribution % slider */}
      <div className="card rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">Contribution Percentage</h2>
        <div className="flex items-center gap-4">
          <input type="range" min="10" max="100" step="5" value={percent}
            onChange={e => setPercent(Number(e.target.value))}
            className="flex-1 accent-brand-500 h-2 cursor-pointer" />
          <span className="text-brand-400 font-bold text-xl w-16 text-right">{percent}%</span>
        </div>
        <p className="text-neutral-500 text-xs mt-2">Minimum 10%. You can give more — every bit counts.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input type="text" className="input-dark pl-10" placeholder="Search charities…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Charity grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map(c => {
          const isSelected = selected === c.id
          return (
            <button key={c.id} onClick={() => setSelected(c.id)}
              className={`text-left p-5 rounded-xl border transition-all ${isSelected ? 'bg-brand-500/12 border-brand-500/40' : 'card-hover border-white/8'}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  {c.is_featured && <span className="badge text-gold-400 bg-gold-400/10 border-gold-400/20 text-xs mb-2">⭐ Featured</span>}
                  <h3 className="text-white font-medium text-sm">{c.name}</h3>
                </div>
                {isSelected && <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-black" />
                </div>}
              </div>
              {c.description && <p className="text-neutral-500 text-xs leading-relaxed line-clamp-2">{c.description}</p>}
              {c.upcoming_events?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                    <Calendar size={11} /> {c.upcoming_events[0].title} — {formatDate(c.upcoming_events[0].date)}
                  </div>
                </div>
              )}
              {c.website && (
                <a href={c.website} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-brand-400/60 hover:text-brand-400 mt-2 transition-colors">
                  Visit website <ExternalLink size={10} />
                </a>
              )}
            </button>
          )
        })}
      </div>

      <button onClick={handleSave} disabled={saving || !selected} className="btn-primary py-3 px-8">
        {saving ? <Loader2 size={15} className="animate-spin" /> : <><Heart size={15} /> Save Selection</>}
      </button>
    </div>
  )
}
