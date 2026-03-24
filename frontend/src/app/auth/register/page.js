'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'

export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(key) { return e => setForm(f => ({ ...f, [key]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options:  { data: { full_name: form.name } },
    })
    if (error) { toast.error(error.message); setLoading(false); return }

    toast.success('Account created! Redirecting…')
    router.push('/dashboard')
    router.refresh()
  }

  const strength = form.password.length >= 8

  return (
    <div className="w-full max-w-md animate-fade-up">
      <div className="card rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>Create Account</h1>
        <p className="text-neutral-500 text-sm mb-8">Join the community of golfers giving back.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Full Name</label>
            <input type="text" className="input-dark" placeholder="Jamie Smith"
              value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Email</label>
            <input type="email" className="input-dark" placeholder="you@example.com"
              value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} className="input-dark pr-12" placeholder="Min 8 characters"
                value={form.password} onChange={set('password')} required />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password.length > 0 && (
              <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${strength ? 'text-brand-400' : 'text-neutral-500'}`}>
                {strength ? <Check size={12} /> : null}
                {strength ? 'Strong password' : 'At least 8 characters required'}
              </div>
            )}
          </div>

          {/* What you get */}
          <div className="bg-brand-500/8 border border-brand-500/15 rounded-lg p-4 space-y-1.5">
            {['Enter Stableford scores', 'Join monthly prize draws', 'Support a chosen charity', 'Track your contributions'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-neutral-300">
                <Check size={13} className="text-brand-400 shrink-0" /> {item}
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary w-full py-3.5" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-neutral-500 text-sm mt-6">
          Already have an account? <Link href="/auth/login" className="text-brand-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
