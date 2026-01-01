const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: process.env.STRIPE_API_VERSION || '2024-06-20',
});

exports.handler = async function (event) {
  const origin = event.headers.origin || '';
  const headers = {
    'Access-Control-Allow-Origin': origin || process.env.FRONTEND_URL,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { items, shipping_fee, customer_email, metadata = {}, shipping_method } = JSON.parse(event.body);
    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No items provided' }) };
    }

    const line_items = items.map(i => ({
      price_data: {
        currency: 'usd',
        product_data: { name: i.name },
        unit_amount: Math.round(i.price * 100),
      },
      quantity: i.quantity,
    }));

    if (shipping_fee) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping' },
          unit_amount: Math.round(shipping_fee * 100),
        },
        quantity: 1,
      });
    }

    const baseUrl = process.env.FRONTEND_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${baseUrl}/success.html`,
      cancel_url: `${baseUrl}/cancel.html`,
      customer_email,
      metadata: { ...metadata, shipping_method: shipping_method || metadata.shipping_method || 'standard' },
    });

    return { statusCode: 200, headers, body: JSON.stringify({ sessionId: session.id }) };
  } catch (err) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: err.message }) };
  }
};
