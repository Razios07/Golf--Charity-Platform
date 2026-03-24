const { stripe } = require('../utils/stripe')
const { supabaseAdmin } = require('../utils/supabase')
const { sendWelcomeEmail } = require('../utils/email')

/**
 * POST /api/webhooks/stripe
 * Raw body required — set up express.raw() before this route.
 */
async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object
        const userId  = session.metadata?.user_id
        const plan    = session.metadata?.plan

        if (!userId || !plan) break

        const sub = await stripe.subscriptions.retrieve(session.subscription)

        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: sub.id,
          plan,
          status: 'active',
          amount: plan === 'monthly' ? 9.99 : 99.99,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
        }, { onConflict: 'user_id' })

        // Send welcome email
        const { data: profile } = await supabaseAdmin
          .from('profiles').select('email, full_name').eq('id', userId).single()
        if (profile) {
          await sendWelcomeEmail(profile.email, profile.full_name || 'Golfer', plan).catch(console.error)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const userId = sub.metadata?.user_id
        if (!userId) break

        const status = sub.status === 'active' ? 'active'
          : sub.status === 'canceled' ? 'cancelled' : 'lapsed'

        await supabaseAdmin.from('subscriptions').update({
          status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await supabaseAdmin.from('subscriptions').update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: 'Handler error' })
  }

  res.json({ received: true })
}

module.exports = { stripeWebhook }
