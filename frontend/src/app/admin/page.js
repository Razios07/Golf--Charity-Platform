'use client'
import { useEffect, useState } from 'react'
import { getAnalytics } from '@/lib/api'
import { formatCurrency, formatMonth } from '@/lib/utils'
import { Users, TrendingUp, Heart, Trophy, Medal, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import toast from 'react-hot-toast'

export default function AdminAnalyticsPage() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics()
      .then(r => setData(r.analytics))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center pt-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>
  if (!data)   return <p className="text-neutral-500">No data.</p>

  const topStats = [
    { icon: <Users size={18} className="text-brand-400" />,  label: 'Total Users',       value: data.totalUsers },
    { icon: <TrendingUp size={18} className="text-green-400" />, label: 'Active Subscribers', value: data.activeSubscribers },
    { icon: <Trophy size={18} className="text-gold-400" />,  label: 'Total Prize Pool',  value: formatCurrency(data.totalPrizePool) },
    { icon: <Heart size={18} className="text-red-400" />,    label: 'Charity Raised',    value: formatCurrency(data.totalCharityRaised) },
    { icon: <Medal size={18} className="text-blue-400" />,   label: 'Total Paid Out',    value: formatCurrency(data.totalPaidOut) },
  ]

  const chartData = (data.recentPools || [])
    .map(p => ({ name: formatMonth(p.month).split(' ')[0], pool: p.total_pool }))
    .reverse()

  const signupChart = (data.signupTrend || [])
    .map(s => ({ name: formatMonth(s.month).split(' ')[0], signups: s.count }))

  return (
    <div className="space-y-8 stagger">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Analytics</h1>
        <p className="text-neutral-500 text-sm mt-1">Platform-wide overview and reporting.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {topStats.map((s, i) => (
          <div key={i} className="stat-card rounded-xl">
            <div className="p-2 bg-white/5 rounded-lg w-fit mb-3">{s.icon}</div>
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-neutral-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Prize pool chart */}
        {chartData.length > 0 && (
          <div className="card rounded-xl p-5">
            <h2 className="font-semibold text-white mb-5">Prize Pool (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `£${v}`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '13px' }}
                  labelStyle={{ color: '#f5f5f5' }}
                  formatter={v => [formatCurrency(v), 'Pool']}
                />
                <Bar dataKey="pool" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Signup trend */}
        {signupChart.length > 0 && (
          <div className="card rounded-xl p-5">
            <h2 className="font-semibold text-white mb-5">New Signups Trend</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={signupChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '13px' }}
                  labelStyle={{ color: '#f5f5f5' }}
                  formatter={v => [v, 'Signups']}
                />
                <Bar dataKey="signups" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent draws table */}
      {data.recentDraws?.length > 0 && (
        <div className="card rounded-xl overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="font-semibold text-white">Recent Draws</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table-dark">
              <thead>
                <tr><th>Month</th><th>Type</th><th>Status</th><th>Jackpot</th><th>Winning Numbers</th></tr>
              </thead>
              <tbody>
                {data.recentDraws.map(d => (
                  <tr key={d.id}>
                    <td className="text-white">{formatMonth(d.month)}</td>
                    <td className="capitalize">{d.draw_type}</td>
                    <td><span className={`badge border ${d.status === 'published' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-blue-400 bg-blue-400/10 border-blue-400/20'}`}>{d.status}</span></td>
                    <td>{formatCurrency(d.jackpot_amount)}</td>
                    <td className="font-mono text-xs">{d.winning_numbers?.join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
