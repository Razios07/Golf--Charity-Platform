'use client'
import { useEffect, useState } from 'react'
import { getCharities, createCharity, updateCharity, deleteCharity } from '@/lib/api'
import { Plus, Pencil, Trash2, Save, X, Loader2, Star } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { name: '', description: '', image_url: '', website: '', is_featured: false }

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(EMPTY)
  const [editing,   setEditing]   = useState(null)
  const [saving,    setSaving]    = useState(false)

  async function load() {
    // Admin needs all charities including inactive — use search for now
    const { charities } = await getCharities()
    setCharities(charities)
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })) }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      if (editing) {
        const { charity } = await updateCharity(editing, form)
        setCharities(cs => cs.map(c => c.id === editing ? charity : c))
        toast.success('Charity updated')
      } else {
        const { charity } = await createCharity(form)
        setCharities(cs => [charity, ...cs])
        toast.success('Charity created')
      }
      setShowForm(false)
      setEditing(null)
      setForm(EMPTY)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deactivate this charity?')) return
    try {
      await deleteCharity(id)
      setCharities(cs => cs.filter(c => c.id !== id))
      toast.success('Charity deactivated')
    } catch (err) {
      toast.error(err.message)
    }
  }

  function startEdit(c) {
    setEditing(c.id)
    setForm({ name: c.name, description: c.description || '', image_url: c.image_url || '', website: c.website || '', is_featured: c.is_featured })
    setShowForm(true)
  }

  if (loading) return <div className="flex justify-center pt-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>

  return (
    <div className="space-y-6 stagger">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Charities</h1>
          <p className="text-neutral-500 text-sm mt-1">{charities.length} active charities</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY) }} className="btn-primary">
          <Plus size={15} /> Add Charity
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card rounded-xl p-6">
          <h2 className="font-semibold text-white mb-5">{editing ? 'Edit Charity' : 'New Charity'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-neutral-400 mb-1.5">Name *</label>
              <input className="input-dark" placeholder="Charity name" value={form.name} onChange={set('name')} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-neutral-400 mb-1.5">Description</label>
              <textarea className="input-dark h-24 resize-none" placeholder="Brief description…" value={form.description} onChange={set('description')} />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5">Image URL</label>
              <input className="input-dark" placeholder="https://…" value={form.image_url} onChange={set('image_url')} />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5">Website</label>
              <input className="input-dark" placeholder="https://…" value={form.website} onChange={set('website')} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="featured" checked={form.is_featured} onChange={set('is_featured')}
                className="w-4 h-4 accent-brand-500 cursor-pointer" />
              <label htmlFor="featured" className="text-sm text-neutral-300 cursor-pointer flex items-center gap-1.5">
                <Star size={13} className="text-gold-400" /> Featured charity
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> {editing ? 'Update' : 'Create'}</>}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY) }} className="btn-ghost">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr><th>Name</th><th>Featured</th><th>Website</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {charities.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="text-white text-sm">{c.name}</div>
                    {c.description && <div className="text-neutral-600 text-xs truncate max-w-xs">{c.description}</div>}
                  </td>
                  <td>{c.is_featured ? <Star size={14} className="text-gold-400" fill="currentColor" /> : <span className="text-neutral-700">—</span>}</td>
                  <td>
                    {c.website
                      ? <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-brand-400 text-xs hover:underline">{c.website.replace('https://', '')}</a>
                      : <span className="text-neutral-700">—</span>
                    }
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <button onClick={() => startEdit(c)} className="btn-ghost py-1 px-2 text-xs"><Pencil size={12} /></button>
                      <button onClick={() => handleDelete(c.id)} className="btn-ghost py-1 px-2 text-xs text-neutral-500 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
