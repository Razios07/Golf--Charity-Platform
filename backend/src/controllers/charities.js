const { supabaseAdmin } = require('../utils/supabase')

/** GET /api/charities */
async function getCharities(req, res) {
  const { search, featured } = req.query

  let query = supabaseAdmin
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name')

  if (search) query = query.ilike('name', `%${search}%`)
  if (featured === 'true') query = query.eq('is_featured', true)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ charities: data })
}

/** GET /api/charities/:id */
async function getCharity(req, res) {
  const { data, error } = await supabaseAdmin
    .from('charities')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(404).json({ error: 'Charity not found' })
  res.json({ charity: data })
}

/** POST /api/charities — admin */
async function createCharity(req, res) {
  const { name, description, image_url, website, is_featured, upcoming_events } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })

  const { data, error } = await supabaseAdmin
    .from('charities')
    .insert({ name, description, image_url, website, is_featured: !!is_featured, upcoming_events: upcoming_events || [] })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json({ charity: data })
}

/** PATCH /api/charities/:id — admin */
async function updateCharity(req, res) {
  const { data, error } = await supabaseAdmin
    .from('charities')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ charity: data })
}

/** DELETE /api/charities/:id — soft delete (admin) */
async function deleteCharity(req, res) {
  const { error } = await supabaseAdmin
    .from('charities')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
}

/** GET /api/user/charity — user's selected charity */
async function getUserCharity(req, res) {
  const { data, error } = await supabaseAdmin
    .from('user_charities')
    .select('*, charity:charities(*)')
    .eq('user_id', req.user.id)
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ userCharity: data || null })
}

/** POST /api/user/charity — set/update charity selection */
async function setUserCharity(req, res) {
  const { charity_id, contribution_percent } = req.body
  if (!charity_id) return res.status(400).json({ error: 'charity_id is required' })

  const percent = Math.max(10, Math.min(100, parseInt(contribution_percent) || 10))

  const { data, error } = await supabaseAdmin
    .from('user_charities')
    .upsert(
      { user_id: req.user.id, charity_id, contribution_percent: percent, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select('*, charity:charities(*)')
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ userCharity: data })
}

module.exports = { getCharities, getCharity, createCharity, updateCharity, deleteCharity, getUserCharity, setUserCharity }
