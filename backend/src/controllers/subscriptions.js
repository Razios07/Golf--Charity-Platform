const { supabaseAdmin } = require('../utils/supabase')
const { createCheckoutSession, createPortalSession } = require('../utils/stripe')

const APP_URL = process.env.CLIENT_URL || 'http://localhost:3000'

/** GET /api/subscriptions/me */
async function getMySubscription(req, res) {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user.id)
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ subscription: data || null })
}

/** POST /api/subscriptions/checkout — create Stripe checkout session */
async function createCheckout(req, res) {
  const { plan } = req.body
  if (!['monthly', 'yearly'].includes(plan)) {
    return res.status(400).json({ error: 'plan must be "monthly" or "yearly"' })
  }

  try {
    const session = await createCheckoutSession({
      userId: req.user.id,
      email: req.user.email,
      plan,
      successUrl: `${APP_URL}/dashboard?subscription=success`,
      cancelUrl: `${APP_URL}/subscribe?cancelled=true`,
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    res.status(500).json({ error: err.message })
  }
}

/** POST /api/subscriptions/portal — Stripe customer portal */
async function openPortal(req, res) {
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', req.user.id)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return res.status(404).json({ error: 'No Stripe customer found' })
  }

  try {
    const session = await createPortalSession(
      sub.stripe_customer_id,
      `${APP_URL}/dashboard/subscription`
    )
    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

/** GET /api/admin/subscriptions — all subscriptions (admin) */
async function getAllSubscriptions(req, res) {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ subscriptions: data })
}

module.exports = { getMySubscription, createCheckout, openPortal, getAllSubscriptions }
