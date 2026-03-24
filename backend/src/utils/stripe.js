const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

/**
 * Create a Stripe Checkout session for a new subscription.
 */
async function createCheckoutSession({ userId, email, plan, successUrl, cancelUrl }) {
  const priceId = plan === 'yearly'
    ? process.env.STRIPE_YEARLY_PRICE_ID
    : process.env.STRIPE_MONTHLY_PRICE_ID

  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: userId, plan },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: { metadata: { user_id: userId, plan } },
  })
}

/**
 * Create a Stripe Customer Portal session so users can manage billing.
 */
async function createPortalSession(customerId, returnUrl) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

module.exports = { stripe, createCheckoutSession, createPortalSession }
