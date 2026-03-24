import { createClient } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

/**
 * Core fetch wrapper — automatically attaches the Supabase JWT.
 */
async function apiFetch(path, options = {}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

// ── Scores ────────────────────────────────────────────────────────────
export const getScores          = ()       => apiFetch('/scores')
export const addScore           = (body)   => apiFetch('/scores', { method: 'POST', body: JSON.stringify(body) })
export const updateScore        = (id, b)  => apiFetch(`/scores/${id}`, { method: 'PATCH', body: JSON.stringify(b) })
export const deleteScore        = (id)     => apiFetch(`/scores/${id}`, { method: 'DELETE' })

// ── Charities ─────────────────────────────────────────────────────────
export const getCharities       = (params) => apiFetch(`/charities?${new URLSearchParams(params || {})}`)
export const getCharity         = (id)     => apiFetch(`/charities/${id}`)
export const createCharity      = (body)   => apiFetch('/charities', { method: 'POST', body: JSON.stringify(body) })
export const updateCharity      = (id, b)  => apiFetch(`/charities/${id}`, { method: 'PATCH', body: JSON.stringify(b) })
export const deleteCharity      = (id)     => apiFetch(`/charities/${id}`, { method: 'DELETE' })

// ── User charity selection ────────────────────────────────────────────
export const getUserCharity     = ()       => apiFetch('/user/charity')
export const setUserCharity     = (body)   => apiFetch('/user/charity', { method: 'POST', body: JSON.stringify(body) })

// ── Subscriptions ─────────────────────────────────────────────────────
export const getMySubscription  = ()       => apiFetch('/subscriptions/me')
export const createCheckout     = (plan)   => apiFetch('/subscriptions/checkout', { method: 'POST', body: JSON.stringify({ plan }) })
export const openPortal         = ()       => apiFetch('/subscriptions/portal', { method: 'POST' })

// ── Draws ─────────────────────────────────────────────────────────────
export const getDraws           = ()       => apiFetch('/draws')
export const getDraw            = (id)     => apiFetch(`/draws/${id}`)
export const getMyEntry         = (drawId) => apiFetch(`/draws/${drawId}/my-entry`)

// ── Winners ───────────────────────────────────────────────────────────
export const getWinners         = ()       => apiFetch('/winners')
export const updateWinner       = (id, b)  => apiFetch(`/winners/${id}`, { method: 'PATCH', body: JSON.stringify(b) })

// ── Admin ─────────────────────────────────────────────────────────────
export const getAnalytics       = ()       => apiFetch('/admin/analytics')
export const getAdminUsers      = ()       => apiFetch('/admin/users')
export const updateAdminUser    = (id, b)  => apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(b) })
export const getAdminUserScores = (id)     => apiFetch(`/admin/users/${id}/scores`)
export const getAdminSubs       = ()       => apiFetch('/admin/subscriptions')
export const manageDraw         = (body)   => apiFetch('/admin/draws', { method: 'POST', body: JSON.stringify(body) })
export const getAdminWinners    = ()       => apiFetch('/winners')
