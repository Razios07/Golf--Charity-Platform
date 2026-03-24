import Link from 'next/link'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      <header className="p-6">
        <Link href="/" className="text-brand-400 text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          ⛳ GolfCharity
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  )
}
