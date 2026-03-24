const { supabaseAdmin } = require('../utils/supabase')

/** GET /api/admin/analytics */
async function getAnalytics(req, res) {
  const [
    { count: totalUsers },
    { count: activeSubscribers },
    { data: poolData },
    { data: charityData },
    { data: recentDraws },
    { data: paidWinners },
    { data: allUsers },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('prize_pools').select('total_pool, month').order('month', { ascending: false }).limit(6),
    supabaseAdmin.from('charity_donations').select('amount'),
    supabaseAdmin.from('draws').select('*').order('month', { ascending: false }).limit(6),
    supabaseAdmin.from('winners').select('prize_amount').eq('payment_status', 'paid'),
    supabaseAdmin.from('profiles').select('created_at').order('created_at', { ascending: false }).limit(30),
  ])

  const totalPrizePool    = (poolData || []).reduce((s, p) => s + p.total_pool, 0)
  const totalCharityRaised = (charityData || []).reduce((s, d) => s + d.amount, 0)
  const totalPaidOut      = (paidWinners || []).reduce((s, w) => s + w.prize_amount, 0)

  // Monthly signup trend (last 30 users bucketed by month)
  const signupsByMonth = {}
  ;(allUsers || []).forEach(u => {
    const month = u.created_at.slice(0, 7)
    signupsByMonth[month] = (signupsByMonth[month] || 0) + 1
  })
  const signupTrend = Object.entries(signupsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))

  res.json({
    analytics: {
      totalUsers,
      activeSubscribers,
      totalPrizePool,
      totalCharityRaised,
      totalPaidOut,
      recentPools: poolData || [],
      recentDraws: recentDraws || [],
      signupTrend,
    },
  })
}

/** GET /api/admin/users — all users with subscription info */
async function getUsers(req, res) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*, subscriptions(plan, status, amount, current_period_end)')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ users: data })
}

/** PATCH /api/admin/users/:id — edit user profile */
async function updateUser(req, res) {
  const { full_name, handicap, role } = req.body
  const updates = {}
  if (full_name !== undefined) updates.full_name = full_name
  if (handicap  !== undefined) updates.handicap  = handicap
  if (role      !== undefined) updates.role       = role
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ user: data })
}

/** GET /api/admin/users/:id/scores — admin view of any user's scores */
async function getUserScores(req, res) {
  const { data, error } = await supabaseAdmin
    .from('golf_scores')
    .select('*')
    .eq('user_id', req.params.id)
    .order('played_at', { ascending: false })
    .limit(5)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ scores: data })
}

module.exports = { getAnalytics, getUsers, updateUser, getUserScores }
