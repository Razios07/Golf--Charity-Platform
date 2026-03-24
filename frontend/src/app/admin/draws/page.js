'use client'
import { useEffect, useState } from 'react'
import { getDraws, manageDraw } from '@/lib/api'
import { formatCurrency, formatMonth, getStatusColor } from '@/lib/utils'
import { Play, Send, Loader2, Trophy, Zap, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDrawsPage() {
  const [draws,      setDraws]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [running,    setRunning]    = useState(false)
  const [simulation, setSimulation] = useState(null)
  const [config,     setConfig]     = useState({ month: new Date().toISOString().slice(0, 7), draw_type: 'random' })

  async function load() {
    const { draws } = await getDraws()
    setDraws(draws)
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  async function handleSimulate() {
    setRunning(true)
    setSimulation(null)
    try {
      const { simulation: sim } = await manageDraw({ action: 'simulate', ...config })
      setSimulation(sim)
      toast.success('Simulation complete!')
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRunning(false)
    }
  }

  async function handlePublish() {
    if (!confirm(`Publish the ${formatMonth(config.month)} draw? This will notify all participants and cannot be undone.`)) return
    setRunning(true)
    try {
      const { results } = await manageDraw({ action: 'publish', ...config })
      setSimulation(null)
      toast.success(`Draw published! ${results.winners_5match + results.winners_4match + results.winners_3match} winner(s) found.`)
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <div className="flex justify-center pt-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>

  return (
    <div className="space-y-8 stagger">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Draw Manager</h1>
        <p className="text-neutral-500 text-sm mt-1">Configure, simulate, and publish monthly draws.</p>
      </div>

      {/* Draw configuration */}
      <div className="card rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-white">Configure Draw</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Draw Month</label>
            <input type="month" className="input-dark"
              value={config.month}
              onChange={e => setConfig(c => ({ ...c, month: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Draw Type</label>
            <select className="input-dark"
              value={config.draw_type}
              onChange={e => setConfig(c => ({ ...c, draw_type: e.target.value }))}>
              <option value="random">🎲 Random — standard lottery</option>
              <option value="algorithmic">⚡ Algorithmic — frequency weighted</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={handleSimulate} disabled={running} className="btn-secondary">
            {running ? <Loader2 size={15} className="animate-spin" /> : <><Play size={15} /> Run Simulation</>}
          </button>
          <button onClick={handlePublish} disabled={running} className="btn-primary">
            {running ? <Loader2 size={15} className="animate-spin" /> : <><Send size={15} /> Publish Draw</>}
          </button>
        </div>

        {/* Algorithmic note */}
        {config.draw_type === 'algorithmic' && (
          <p className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Zap size={11} className="text-gold-400" />
            Algorithmic mode weights drawn numbers toward frequently submitted scores across all users.
          </p>
        )}
      </div>

      {/* Simulation result */}
      {simulation && (
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Play size={16} className="text-blue-400" /> Simulation Result
          </h2>
          <div className="mb-4">
            <p className="text-neutral-400 text-sm mb-3">Drawn Numbers:</p>
            <div className="flex flex-wrap gap-3">
              {simulation.winning_numbers.map((n, i) => (
                <div key={i} className="score-ball gold">{String(n).padStart(2, '0')}</div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Eligible Entries',  value: simulation.eligible_entries },
              { label: '5-Match Winners',   value: simulation.winners_5match,   prize: simulation.prize_5match },
              { label: '4-Match Winners',   value: simulation.winners_4match,   prize: simulation.prize_4match },
              { label: '3-Match Winners',   value: simulation.winners_3match,   prize: simulation.prize_3match },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3">
                <div className="text-white font-semibold">{s.value}</div>
                <div className="text-neutral-500 text-xs">{s.label}</div>
                {s.prize > 0 && <div className="text-brand-400 text-xs mt-1">{formatCurrency(s.prize)} each</div>}
              </div>
            ))}
          </div>
          {simulation.jackpot_won && (
            <p className="text-gold-400 text-sm mt-4 flex items-center gap-2">
              <Trophy size={14} /> Jackpot would be won!
            </p>
          )}
          {!simulation.jackpot_won && (
            <p className="text-neutral-500 text-sm mt-4 flex items-center gap-2">
              <RotateCcw size={14} /> Jackpot would roll over to next month.
            </p>
          )}
          <p className="text-neutral-600 text-xs mt-3">This is a simulation only. Click "Publish Draw" to make it official.</p>
        </div>
      )}

      {/* Draw history */}
      <div className="card rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold text-white">Draw History</h2>
        </div>
        {draws.length === 0 ? (
          <div className="p-10 text-center text-neutral-500 text-sm">No draws yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-dark">
              <thead>
                <tr><th>Month</th><th>Type</th><th>Status</th><th>Jackpot</th><th>4-Match Pool</th><th>3-Match Pool</th><th>Rollover</th><th>Numbers</th></tr>
              </thead>
              <tbody>
                {draws.map(d => (
                  <tr key={d.id}>
                    <td className="text-white font-medium">{formatMonth(d.month)}</td>
                    <td className="capitalize text-xs">{d.draw_type}</td>
                    <td><span className={`badge border ${getStatusColor(d.status)}`}>{d.status}</span></td>
                    <td>{formatCurrency(d.jackpot_amount)}</td>
                    <td>{formatCurrency(d.pool_4match)}</td>
                    <td>{formatCurrency(d.pool_3match)}</td>
                    <td>{d.jackpot_rollover ? <span className="text-gold-400 text-xs">Yes</span> : <span className="text-neutral-600 text-xs">No</span>}</td>
                    <td className="font-mono text-xs text-neutral-400">{d.winning_numbers?.join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
