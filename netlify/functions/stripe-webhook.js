import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function handler(event) {
  const sig = event.headers['stripe-signature'];
  let evt;

  try {
    evt = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (evt.type === 'checkout.session.completed') {
    const session = evt.data.object;
    console.log('✅ Payment success:', session.customer_email);
  }

  return { statusCode: 200, body: 'ok' };
}

