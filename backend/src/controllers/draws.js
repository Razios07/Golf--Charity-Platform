const { supabaseAdmin } = require('../utils/supabase')
const {
  generateRandomNumbers,
  generateAlgorithmicNumbers,
  simulateDraw,
  calculatePrizePerWinner,
  POOL_DISTRIBUTION,
} = require('../utils/drawEngine')
const { sendDrawResultEmail } = require('../utils/email')

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

/** GET /api/draws — published draws (all users) or all draws (admin) */
async function getDraws(req, res) {
  const isAdmin = req.profile?.role === 'admin'
  let query = supabaseAdmin.from('draws').select('*').order('month', { ascending: false })
  if (!isAdmin) query = query.eq('status', 'published')

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ draws: data })
}

/** GET /api/draws/:id */
async function getDraw(req, res) {
  const { data, error } = await supabaseAdmin
    .from('draws')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(404).json({ error: 'Draw not found' })
  res.json({ draw: data })
}

/** GET /api/draws/:id/my-entry — user's entry in a specific draw */
async function getMyEntry(req, res) {
  const { data, error } = await supabaseAdmin
    .from('draw_entries')
    .select('*')
    .eq('draw_id', req.params.id)
    .eq('user_id', req.user.id)
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ entry: data || null })
}

/**
 * POST /api/admin/draws
 * body: { action: 'simulate' | 'publish', month?, draw_type? }
 */
async function manageDraw(req, res) {
  const { action, month, draw_type } = req.body
  if (!['simulate', 'publish'].includes(action)) {
    return res.status(400).json({ error: 'action must be "simulate" or "publish"' })
  }

  const targetMonth = month || getCurrentMonth()

  // ── Fetch prize pool for the month ──────────────────────────────
  const { data: pool } = await supabaseAdmin
    .from('prize_pools')
    .select('*')
    .eq('month', targetMonth)
    .maybeSingle()

  // ── Collect all scores to build eligible entries ─────────────────
  const { data: allScoreRows } = await supabaseAdmin
    .from('golf_scores')
    .select('user_id, score, played_at')
    .order('played_at', { ascending: false })

  // Group by user, keep latest 5 only
  const userScoresMap = new Map()
  ;(allScoreRows || []).forEach(row => {
    const arr = userScoresMap.get(row.user_id) || []
    if (arr.length < 5) { arr.push(row.score); userScoresMap.set(row.user_id, arr) }
  })

  // Only users with all 5 scores are eligible
  const eligibleEntries = Array.from(userScoresMap.entries())
    .filter(([, scores]) => scores.length === 5)
    .map(([user_id, scores]) => ({ user_id, scores }))

  // ── Generate winning numbers ──────────────────────────────────────
  const allScores = (allScoreRows || []).map(r => r.score)
  const winningNumbers = draw_type === 'algorithmic'
    ? generateAlgorithmicNumbers(allScores)
    : generateRandomNumbers()

  // ── Simulate results ──────────────────────────────────────────────
  const { winners5, winners4, winners3, matchResults } = simulateDraw(eligibleEntries, winningNumbers)

  const jackpotPool = (pool?.jackpot_pool || 0) + (pool?.jackpot_carried || 0)
  const pool4       = pool?.match4_pool || 0
  const pool3       = pool?.match3_pool || 0
  const jackpotWon  = winners5.length > 0
  const prize5 = calculatePrizePerWinner(jackpotPool, winners5.length)
  const prize4 = calculatePrizePerWinner(pool4,       winners4.length)
  const prize3 = calculatePrizePerWinner(pool3,       winners3.length)

  // ── SIMULATE (preview only, no notifications) ────────────────────
  if (action === 'simulate') {
    await supabaseAdmin.from('draws').upsert({
      month: targetMonth,
      draw_type: draw_type || 'random',
      winning_numbers: winningNumbers,
      status: 'simulated',
      jackpot_amount: jackpotPool,
      pool_4match: pool4,
      pool_3match: pool3,
      jackpot_rollover: !jackpotWon,
    }, { onConflict: 'month' })

    return res.json({
      simulation: {
        winning_numbers: winningNumbers,
        eligible_entries: eligibleEntries.length,
        winners_5match: winners5.length,
        winners_4match: winners4.length,
        winners_3match: winners3.length,
        prize_5match: prize5,
        prize_4match: prize4,
        prize_3match: prize3,
        jackpot_won: jackpotWon,
      },
    })
  }

  // ── PUBLISH ───────────────────────────────────────────────────────
  const { data: draw, error: drawError } = await supabaseAdmin
    .from('draws')
    .upsert({
      month: targetMonth,
      draw_type: draw_type || 'random',
      winning_numbers: winningNumbers,
      status: 'published',
      jackpot_amount: jackpotPool,
      pool_4match: pool4,
      pool_3match: pool3,
      jackpot_rollover: !jackpotWon,
      published_at: new Date().toISOString(),
    }, { onConflict: 'month' })
    .select()
    .single()

  if (drawError) return res.status(500).json({ error: drawError.message })

  // Save entries
  const drawEntries = eligibleEntries.map(e => ({
    draw_id: draw.id,
    user_id: e.user_id,
    scores: e.scores,
    match_count: matchResults[e.user_id] || 0,
    prize_amount: winners5.includes(e.user_id) ? prize5
      : winners4.includes(e.user_id) ? prize4
      : winners3.includes(e.user_id) ? prize3 : 0,
  }))

  if (drawEntries.length > 0) {
    await supabaseAdmin.from('draw_entries').upsert(drawEntries, { onConflict: 'draw_id,user_id' })
  }

  // Save winner records
  const winnerRows = [
    ...winners5.map(uid => ({ draw_id: draw.id, user_id: uid, match_type: '5-match', prize_amount: prize5 })),
    ...winners4.map(uid => ({ draw_id: draw.id, user_id: uid, match_type: '4-match', prize_amount: prize4 })),
    ...winners3.map(uid => ({ draw_id: draw.id, user_id: uid, match_type: '3-match', prize_amount: prize3 })),
  ]
  if (winnerRows.length > 0) await supabaseAdmin.from('winners').insert(winnerRows)

  // Rollover jackpot to next month's pool if unclaimed
  if (!jackpotWon && jackpotPool > 0) {
    const next = new Date(`${targetMonth}-01`)
    next.setMonth(next.getMonth() + 1)
    const nextMonthKey = next.toISOString().slice(0, 7)
    await supabaseAdmin.from('prize_pools').upsert({
      month: nextMonthKey, total_pool: 0, jackpot_pool: 0, match4_pool: 0, match3_pool: 0,
      jackpot_carried: jackpotPool, active_subscribers: 0,
    }, { onConflict: 'month' })
  }

  // Fire-and-forget email notifications
  Promise.allSettled(
    drawEntries.map(async entry => {
      const { data: p } = await supabaseAdmin.from('profiles').select('email, full_name').eq('id', entry.user_id).single()
      if (p) await sendDrawResultEmail(p.email, p.full_name || 'Golfer', entry.match_count, entry.prize_amount || undefined)
    })
  )

  res.json({
    draw,
    results: {
      winning_numbers: winningNumbers,
      winners_5match: winners5.length,
      winners_4match: winners4.length,
      winners_3match: winners3.length,
      jackpot_won: jackpotWon,
    },
  })
}

module.exports = { getDraws, getDraw, getMyEntry, manageDraw }
