const { supabaseAdmin } = require('../utils/supabase')
const { sendVerificationEmail } = require('../utils/email')

/** GET /api/winners — own wins or all (admin) */
async function getWinners(req, res) {
  const isAdmin = req.profile?.role === 'admin'

  let query = supabaseAdmin
    .from('winners')
    .select('*, profiles(full_name, email), draws(month, winning_numbers)')
    .order('created_at', { ascending: false })

  if (!isAdmin) query = query.eq('user_id', req.user.id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ winners: data })
}

/** PATCH /api/winners/:id — user uploads proof OR admin approves/rejects */
async function updateWinner(req, res) {
  const { id } = req.params
  const isAdmin = req.profile?.role === 'admin'
  const { proof_url, verification_status, payment_status, admin_notes } = req.body

  const updates = { updated_at: new Date().toISOString() }

  if (!isAdmin) {
    // Users can only upload proof screenshot URL
    if (!proof_url) return res.status(400).json({ error: 'proof_url is required' })
    updates.proof_url = proof_url
  } else {
    if (verification_status) updates.verification_status = verification_status
    if (payment_status)      updates.payment_status = payment_status
    if (admin_notes !== undefined) updates.admin_notes = admin_notes

    // Send email on status change
    if (verification_status === 'approved' || verification_status === 'rejected') {
      const { data: winner } = await supabaseAdmin
        .from('winners')
        .select('*, profiles(email, full_name)')
        .eq('id', id)
        .single()

      if (winner?.profiles) {
        await sendVerificationEmail(
          winner.profiles.email,
          winner.profiles.full_name || 'Golfer',
          verification_status === 'approved',
          admin_notes
        ).catch(console.error)
      }
    }
  }

  const baseQuery = supabaseAdmin.from('winners').update(updates).eq('id', id)
  const { data, error } = await (isAdmin ? baseQuery : baseQuery.eq('user_id', req.user.id))
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Winner record not found' })
  res.json({ winner: data })
}

module.exports = { getWinners, updateWinner }
