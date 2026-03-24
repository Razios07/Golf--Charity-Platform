'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Trophy, Heart, ArrowRight, ChevronRight, Star, Users, Globe, Zap } from 'lucide-react'

const STATS = [
  { value: '£12,400+', label: 'Raised for charity' },
  { value: '340+',     label: 'Active members' },
  { value: '12',       label: 'Draws completed' },
  { value: '£840',     label: 'Largest jackpot' },
]

const STEPS = [
  { icon: '🏌️', n: '01', title: 'Subscribe',       desc: 'Join monthly or yearly. A portion goes to the prize pool, a portion to your chosen charity.' },
  { icon: '⛳', n: '02', title: 'Log Your Scores',  desc: 'Enter your latest 5 Stableford scores (1–45). We always keep your rolling five most recent.' },
  { icon: '🎱', n: '03', title: 'Monthly Draw',     desc: 'Each month we draw 5 numbers. Match 3, 4, or all 5 of your scores to win a prize.' },
  { icon: '❤️', n: '04', title: 'Give Back',        desc: 'A minimum 10% of your subscription reaches your chosen charity every single month.' },
]

const PRIZES = [
  { icon: '👑', label: 'Jackpot',      match: '5 Numbers', share: '40% of pool', gold: true,  note: 'Rolls over if unclaimed' },
  { icon: '🥇', label: 'Major Prize',  match: '4 Numbers', share: '35% of pool', gold: false, note: '' },
  { icon: '🥈', label: 'Prize',        match: '3 Numbers', share: '25% of pool', gold: false, note: '' },
]

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div className="min-h-screen bg-mesh">

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-dark-900/90 backdrop-blur-md border-b border-white/5' : ''}`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="text-brand-400 text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            ⛳ GolfCharity
          </Link>
          <div className="hidden md:flex gap-7 text-sm text-neutral-400">
            {['#how-it-works', '#prizes', '#charities'].map((href, i) => (
              <Link key={i} href={href} className="hover:text-white transition-colors capitalize">
                {href.replace('#', '').replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login"    className="btn-ghost text-sm">Sign In</Link>
            <Link href="/auth/register" className="btn-primary text-sm">Get Started <ArrowRight size={14} /></Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-5 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-brand-400 text-sm mb-8 animate-fade-up">
          <Heart size={13} fill="currentColor" /> Every subscription gives back
        </div>
        <h1 className="text-5xl sm:text-7xl font-black text-white leading-tight mb-6 animate-fade-up"
          style={{ fontFamily: 'var(--font-display)', animationDelay: '0.05s' }}>
          Golf that makes<br /><span className="text-brand-400">a difference.</span>
        </h1>
        <p className="text-neutral-400 text-xl max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          Track your Stableford scores, compete in monthly prize draws, and support the charities you care about — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <Link href="/auth/register" className="btn-primary px-8 py-4 rounded-xl text-base">
            Start for £9.99/month <ChevronRight size={18} />
          </Link>
          <Link href="#how-it-works" className="btn-secondary px-8 py-4 rounded-xl text-base">
            How it works
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 stagger">
          {STATS.map((s, i) => (
            <div key={i} className="stat-card text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div className="text-neutral-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Charity Impact Banner ────────────────────────────────────── */}
      <section className="bg-brand-700/10 border-y border-brand-500/15 py-12 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <Heart className="text-brand-400 mx-auto mb-3" size={30} fill="currentColor" />
          <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>Leading with purpose</h2>
          <p className="text-neutral-400 text-lg">
            This isn't just a golf platform — it's a vehicle for good. A minimum 10% of every subscription goes directly to your chosen charity, every single month, regardless of whether you win.
          </p>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-5 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>Simple. Rewarding. Purposeful.</h2>
          <p className="text-neutral-400">Four steps that change how you experience the game.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
          {STEPS.map((s, i) => (
            <div key={i} className="card-hover p-6 rounded-xl">
              <div className="text-3xl mb-4">{s.icon}</div>
              <div className="text-xs font-mono text-brand-500 mb-2 tracking-wider">{s.n}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Prizes ───────────────────────────────────────────────────── */}
      <section id="prizes" className="py-24 px-5 bg-white/2">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <Trophy className="text-gold-500 mx-auto mb-4" size={36} />
            <h2 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>Monthly Prize Draw</h2>
            <p className="text-neutral-400">Match your Stableford scores to the 5 drawn numbers. 5-match jackpot rolls over if no one wins.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {PRIZES.map((p, i) => (
              <div key={i} className={`rounded-2xl p-7 text-center border transition-all ${p.gold ? 'bg-gold-500/8 border-gold-500/25' : 'card'}`}>
                <div className="text-4xl mb-3">{p.icon}</div>
                <div className="text-xs text-neutral-500 mb-1">Match {p.match}</div>
                <div className={`text-2xl font-bold mb-2 ${p.gold ? 'text-gold-400' : 'text-white'}`} style={{ fontFamily: 'var(--font-display)' }}>{p.label}</div>
                <div className="text-brand-400 text-sm font-medium">{p.share}</div>
                {p.note && <div className="mt-2 text-xs text-gold-500/60">{p.note}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Charities ────────────────────────────────────────────────── */}
      <section id="charities" className="py-24 px-5 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <Globe className="text-brand-400 mx-auto mb-4" size={36} />
          <h2 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>Choose Your Cause</h2>
          <p className="text-neutral-400">Select a charity at sign-up. A portion of every subscription goes directly to them.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 stagger">
          {[
            { e: '🌱', name: 'Green Fairways Foundation',           desc: 'Youth golf development & environmental conservation' },
            { e: '🎗️', name: 'Cancer Research UK Golf Committee', desc: 'Funding vital cancer research through golf' },
            { e: '🤝', name: 'Golf in Society',                     desc: 'Combating loneliness through the game we love' },
          ].map((c, i) => (
            <div key={i} className="card-hover p-6 rounded-xl">
              <div className="text-3xl mb-3">{c.e}</div>
              <h3 className="text-white font-semibold mb-2">{c.name}</h3>
              <p className="text-neutral-500 text-sm">{c.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-neutral-600 text-sm mt-8">
          More charities available inside the platform —{' '}
          <Link href="/auth/register" className="text-brand-400 hover:underline">join to explore</Link>
        </p>
      </section>

      {/* ── Pricing CTA ──────────────────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-brand-900/40 to-dark-800 border border-brand-500/20 rounded-3xl p-10 md:p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Ready to play with purpose?
            </h2>
            <p className="text-neutral-400 text-lg mb-10">Start today. Cancel anytime.</p>
            <div className="grid sm:grid-cols-2 gap-5 max-w-md mx-auto mb-10">
              {[
                { label: 'Monthly', price: '£9.99', per: '/month', best: false },
                { label: 'Yearly',  price: '£99.99', per: '/year', best: true, saving: 'Save £19.89' },
              ].map((p, i) => (
                <div key={i} className={`relative rounded-2xl p-6 border ${p.best ? 'bg-brand-500/10 border-brand-500/30' : 'card'}`}>
                  {p.best && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-black text-xs font-bold px-3 py-1 rounded-full">BEST VALUE</span>}
                  <div className="text-neutral-400 text-sm mb-1">{p.label}</div>
                  <div className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {p.price}<span className="text-sm font-normal text-neutral-500">{p.per}</span>
                  </div>
                  {p.saving && <div className="text-brand-400 text-xs mt-1">{p.saving}</div>}
                </div>
              ))}
            </div>
            <Link href="/auth/register" className="btn-primary px-10 py-4 rounded-xl text-base">
              Subscribe Now <ArrowRight size={18} />
            </Link>
            <p className="text-neutral-600 text-xs mt-4">PCI-compliant payments via Stripe · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-neutral-600 text-sm">
          <span className="text-white/30" style={{ fontFamily: 'var(--font-display)' }}>⛳ GolfCharity</span>
          <span>© {new Date().getFullYear()} GolfCharity. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="/auth/login"    className="hover:text-neutral-400 transition-colors">Login</Link>
            <Link href="/auth/register" className="hover:text-neutral-400 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
