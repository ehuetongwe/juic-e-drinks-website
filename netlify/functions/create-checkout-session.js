const Stripe = require('stripe');

exports.handler = async function (event) {
  console.log('🔧 Stripe checkout function invoked');

  const origin = event.headers.origin || '';
  console.log(`🌐 Request origin: ${origin}`);
  console.log(`🔧 HTTP method: ${event.httpMethod}`);

  const headers = {
    'Access-Control-Allow-Origin': origin || process.env.FRONTEND_URL,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ OPTIONS preflight request handled');
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    console.log('❌ Method not allowed:', event.httpMethod);
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Validate Stripe secret key exists
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY environment variable is not set!');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error: Missing Stripe credentials' })
    };
  }
  console.log('✅ STRIPE_SECRET_KEY found in environment');

  // Initialize Stripe after validation
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: process.env.STRIPE_API_VERSION || '2024-06-20',
  });
  console.log('✅ Stripe instance created with API version:', process.env.STRIPE_API_VERSION || '2024-06-20');

  try {
    const { items, delivery_fee, customer_email, metadata } = JSON.parse(event.body);
    console.log(`📦 Received ${items?.length || 0} items`);
    console.log(`💰 Delivery fee: $${delivery_fee || 0}`);
    console.log(`📧 Customer email: ${customer_email || 'none'}`);

    if (!Array.isArray(items) || items.length === 0) {
      console.log('❌ No items provided in request');
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No items provided' }) };
    }

    const line_items = items.map(i => {
      console.log(`   - ${i.name}: $${i.price} x ${i.quantity}`);
      return {
        price_data: {
          currency: 'usd',
          product_data: { name: i.name },
          unit_amount: Math.round(i.price * 100),
        },
        quantity: i.quantity,
      };
    });

    if (delivery_fee) {
      console.log(`   - Delivery Fee: $${delivery_fee}`);
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Delivery Fee' },
          unit_amount: Math.round(delivery_fee * 100),
        },
        quantity: 1,
      });
    }

    const baseUrl = process.env.FRONTEND_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || origin;
    console.log(`🌐 Base URL for redirects: ${baseUrl}`);
    console.log(`   - Success URL: ${baseUrl}/success.html`);
    console.log(`   - Cancel URL: ${baseUrl}/cancel.html`);

    console.log('🔧 Creating Stripe checkout session...');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${baseUrl}/success.html`,
      cancel_url: `${baseUrl}/cancel.html`,
      customer_email,
      metadata,
    });

    console.log('✅ Stripe session created successfully!');
    console.log(`   - Session ID: ${session.id}`);
    console.log(`   - Session URL: ${session.url}`);

    return { statusCode: 200, headers, body: JSON.stringify({ sessionId: session.id }) };
  } catch (err) {
    console.error('❌ Error creating checkout session:');
    console.error('   - Error name:', err.name);
    console.error('   - Error message:', err.message);
    console.error('   - Error type:', err.type);
    console.error('   - Error code:', err.code);
    console.error('   - Full error:', err);

    return {
      statusCode: err.statusCode || 400,
      headers,
      body: JSON.stringify({
        error: err.message,
        type: err.type,
        code: err.code
      })
    };
  }
};
