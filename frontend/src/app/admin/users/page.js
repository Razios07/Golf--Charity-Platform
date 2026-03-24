'use client'
import { useEffect, useState } from 'react'
import { getAdminUsers, updateAdminUser, getAdminUserScores } from '@/lib/api'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import { Search, Pencil, Save, X, Loader2, Target, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [editing,  setEditing]  = useState(null)
  const [editForm, setEditForm] = useState({})
  const [expanded, setExpanded] = useState(null) // user id with scores visible
  const [scores,   setScores]   = useState({})   // { userId: [...] }

  useEffect(() => {
    getAdminUsers()
      .then(r => setUsers(r.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpdate(id) {
    try {
      const { user } = await updateAdminUser(id, editForm)
      setUsers(us => us.map(u => u.id === id ? { ...u, ...user } : u))
      setEditing(null)
      toast.success('User updated')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function toggleScores(userId) {
    if (expanded === userId) { setExpanded(null); return }
    setExpanded(userId)
    if (!scores[userId]) {
      try {
        const { scores: s } = await getAdminUserScores(userId)
        setScores(prev => ({ ...prev, [userId]: s }))
      } catch { toast.error('Failed to load scores') }
    }
  }

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center pt-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>

  return (
    <div className="space-y-6 stagger">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Users</h1>
          <p className="text-neutral-500 text-sm mt-1">{users.length} total users</p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input type="text" className="input-dark pl-10" placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Subscription</th>
                <th>Joined</th>
                <th>Scores</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const sub = u.subscriptions?.[0]
                return (
                  <>
                    <tr key={u.id}>
                      <td>
                        {editing === u.id ? (
                          <input className="input-dark py-1.5 text-xs w-40"
                            value={editForm.full_name ?? u.full_name ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                        ) : (
                          <div>
                            <div className="text-white text-sm">{u.full_name || '—'}</div>
                            <div className="text-neutral-500 text-xs">{u.email}</div>
                          </div>
                        )}
                      </td>
                      <td>
                        {editing === u.id ? (
                          <select className="input-dark py-1.5 text-xs w-28"
                            value={editForm.role ?? u.role}
                            onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                            <option value="subscriber">subscriber</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <span className={`badge border ${u.role === 'admin' ? 'text-brand-400 bg-brand-400/10 border-brand-400/20' : 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20'}`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td>
                        {sub ? (
                          <div>
                            <span className={`badge border ${getStatusColor(sub.status)}`}>{sub.status}</span>
                            <div className="text-xs text-neutral-600 mt-1 capitalize">{sub.plan} · {formatCurrency(sub.amount)}</div>
                          </div>
                        ) : <span className="text-neutral-600 text-xs">None</span>}
                      </td>
                      <td className="text-xs">{formatDate(u.created_at)}</td>
                      <td>
                        <button onClick={() => toggleScores(u.id)} className="btn-ghost py-1 px-2 text-xs flex items-center gap-1">
                          <Target size={12} /> View
                          {expanded === u.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                      </td>
                      <td>
                        {editing === u.id ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleUpdate(u.id)} className="btn-primary py-1 px-2 text-xs"><Save size={11} /></button>
                            <button onClick={() => setEditing(null)} className="btn-ghost py-1 px-2 text-xs"><X size={11} /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditing(u.id); setEditForm({}) }}
                            className="btn-ghost py-1 px-2 text-xs">
                            <Pencil size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                    {/* Scores expand row */}
                    {expanded === u.id && (
                      <tr key={`${u.id}-scores`}>
                        <td colSpan={6} className="bg-white/2 px-4 py-3">
                          {scores[u.id] ? (
                            scores[u.id].length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {scores[u.id].map((s, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-neutral-400">
                                    <div className="score-ball w-8 h-8 text-xs">{s.score}</div>
                                    <span>{formatDate(s.played_at)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : <span className="text-neutral-600 text-xs">No scores logged</span>
                          ) : <Loader2 size={14} className="animate-spin text-brand-500" />}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
