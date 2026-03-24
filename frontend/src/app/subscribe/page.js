'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createCheckout } from '@/lib/api'
import { Check, Loader2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '£9.99',
    period: '/month',
    perks: ['Cancel anytime', 'Full platform access', 'Enter monthly draws', '10%+ to charity'],
    best: false,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '£99.99',
    period: '/year',
    saving: 'Save £19.89',
    perks: ['Best value', 'Full platform access', 'Enter monthly draws', '10%+ to charity', 'Priority support'],
    best: true,
  },
]

export default function SubscribePage() {
  const router = useRouter()
  const [selected, setSelected] = useState('yearly')
  const [loading,  setLoading]  = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    try {
      const { url } = await createCheckout(selected)
      window.location.href = url
    } catch (err) {
      toast.error(err.message || 'Could not start checkout. Please sign in first.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      <header className="p-6 flex items-center gap-3">
        <Link href="/dashboard" className="btn-ghost text-sm"><ArrowLeft size={14} /> Back</Link>
        <span className="text-brand-400 font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>⛳ GolfCharity</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>Choose Your Plan</h1>
            <p className="text-neutral-400">Unlock all features and start making a difference.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            {PLANS.map(plan => (
              <button key={plan.id} onClick={() => setSelected(plan.id)}
                className={`relative text-left p-6 rounded-2xl border transition-all ${
                  selected === plan.id
                    ? 'bg-brand-500/12 border-brand-500/50 ring-1 ring-brand-500/30'
                    : 'card border-white/8 hover:border-white/15'
                }`}>
                {plan.best && (
                  <span className="absolute -top-3 left-5 bg-brand-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    BEST VALUE
                  </span>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-neutral-400 text-sm mb-1">{plan.label}</div>
                    <div className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                      {plan.price}<span className="text-sm font-normal text-neutral-500">{plan.period}</span>
                    </div>
                    {plan.saving && <div className="text-brand-400 text-xs mt-1">{plan.saving}</div>}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 transition-all ${
                    selected === plan.id ? 'border-brand-500 bg-brand-500' : 'border-neutral-600'
                  }`}>
                    {selected === plan.id && <Check size={11} className="text-black" />}
                  </div>
                </div>
                <ul className="space-y-2">
                  {plan.perks.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-neutral-400">
                      <Check size={12} className="text-brand-400 shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <button onClick={handleSubscribe} disabled={loading} className="btn-primary w-full py-4 text-base rounded-xl">
            {loading ? <Loader2 size={18} className="animate-spin" /> : `Subscribe — ${PLANS.find(p => p.id === selected)?.price}`}
          </button>
          <p className="text-center text-neutral-600 text-xs mt-3">
            Secure checkout via Stripe · PCI compliant · Cancel anytime
          </p>
        </div>
      </main>
    </div>
  )
}
