const { supabaseAdmin } = require('../utils/supabase')

/**
 * requireAuth — verifies the Bearer token from the Authorization header.
 * Attaches req.user and req.profile on success.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  const token = authHeader.replace('Bearer ', '')

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  // Fetch the profile (role etc.)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  req.user = user
  req.profile = profile
  next()
}

/**
 * requireAdmin — must be used after requireAuth.
 * Rejects non-admin users.
 */
function requireAdmin(req, res, next) {
  if (!req.profile || req.profile.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

/**
 * requireSubscription — must be used after requireAuth.
 * Rejects users without an active subscription.
 */
async function requireSubscription(req, res, next) {
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('status')
    .eq('user_id', req.user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!sub) {
    return res.status(403).json({ error: 'Active subscription required' })
  }
  next()
}

module.exports = { requireAuth, requireAdmin, requireSubscription }
