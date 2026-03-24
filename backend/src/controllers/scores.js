const { supabaseAdmin } = require('../utils/supabase')

/** GET /api/scores — user's latest 5 scores */
async function getScores(req, res) {
  const { data, error } = await supabaseAdmin
    .from('golf_scores')
    .select('*')
    .eq('user_id', req.user.id)
    .order('played_at', { ascending: false })
    .limit(5)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ scores: data })
}

/** POST /api/scores — add a score (triggers rolling-5 DB function) */
async function addScore(req, res) {
  const { score, played_at, notes } = req.body

  const parsed = parseInt(score)
  if (isNaN(parsed) || parsed < 1 || parsed > 45) {
    return res.status(400).json({ error: 'Score must be an integer between 1 and 45' })
  }
  if (!played_at) return res.status(400).json({ error: 'played_at date is required' })

  const { data, error } = await supabaseAdmin
    .from('golf_scores')
    .insert({ user_id: req.user.id, score: parsed, played_at, notes: notes || null })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json({ score: data })
}

/** PATCH /api/scores/:id — edit a score */
async function updateScore(req, res) {
  const { id } = req.params
  const { score, played_at, notes } = req.body

  const updates = {}
  if (score !== undefined) {
    const parsed = parseInt(score)
    if (isNaN(parsed) || parsed < 1 || parsed > 45) {
      return res.status(400).json({ error: 'Score must be between 1 and 45' })
    }
    updates.score = parsed
  }
  if (played_at) updates.played_at = played_at
  if (notes !== undefined) updates.notes = notes || null

  const { data, error } = await supabaseAdmin
    .from('golf_scores')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id) // ownership check
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Score not found' })
  res.json({ score: data })
}

/** DELETE /api/scores/:id */
async function deleteScore(req, res) {
  const { id } = req.params

  const { error } = await supabaseAdmin
    .from('golf_scores')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
}

module.exports = { getScores, addScore, updateScore, deleteScore }
