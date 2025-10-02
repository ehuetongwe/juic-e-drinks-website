# Juic'E Drinks E-commerce Website

A modern, responsive e-commerce website built with vanilla HTML, CSS, and JavaScript, featuring Stripe payment integration and Netlify serverless functions.

## 🏗️ Project Structure

```
/
├── netlify/
│   └── functions/
│       ├── checkout.js      # Stripe checkout endpoint
│       └── webhook.js       # Stripe webhook handler
├── public/
│   ├── index.html          # Landing + catalog + cart
│   ├── product.html        # Individual product page
│   ├── success.html        # Payment success page
│   ├── cancel.html         # Payment cancellation page
│   ├── css/
│   │   └── styles.css      # Main stylesheet
│   └── js/
│       └── main.js         # Main JavaScript functionality
├── package.json            # Dependencies and scripts
├── netlify.toml           # Netlify configuration
├── .env.example           # Example environment variables
└── README.md              # This file
```

## ✨ Features

- Responsive, mobile-first UI using CSS Grid and Flexbox
- Product catalog with filtering and sorting
- Shopping cart with localStorage persistence
- Stripe Checkout integration via Netlify Functions
- Success/Cancel pages and webhook handling
- Modern, accessible UI with animations and focus states

## ⚙️ Prerequisites

- Node.js 18+ installed
- Netlify CLI installed globally (`npm i -g netlify-cli`)
- Stripe account with API keys (`sk_` and `pk_`)

## 🔐 Environment Variables

Create a `.env` file (or set these in Netlify UI):

```
# Stripe API keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe webhook secret
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
# URL=https://your-site.netlify.app
# DEPLOY_PRIME_URL=https://deploy-preview-123--your-site.netlify.app
# SITE_URL=https://www.your-custom-domain.com
```

See `.env.example` for a template.

## 🧑‍💻 Local Development

Install dependencies:

```bash
npm install
```

Start local dev server (serves `public/` and functions):

```bash
npm run dev
```

Start Stripe webhook forwarding in a second terminal:

```bash
npm run dev:stripe
```

List/serve functions locally (optional):

```bash
npm run functions:list
npm run functions:serve
```

Build the project:

```bash
npm run build
```

Deploy to Netlify (requires login/config):

```bash
npm run deploy
```

## 🔌 API Endpoints

- `POST /.netlify/functions/checkout` → Creates a Stripe Checkout Session
  - Accepts `lineItems` (preferred) or `items` fallback
  - Returns `{ sessionId, url }`
- `POST /.netlify/functions/webhook` → Receives Stripe events (signature-verified)

## 💳 Stripe Integration Setup

1. Create a Stripe account and get your API keys from the Dashboard.
2. Copy keys into `.env` (see above).
3. Start local dev: `npm run dev`.
4. In another terminal, forward webhooks:
   ```bash
   stripe listen --forward-to localhost:8888/.netlify/functions/webhook
   ```
5. In the app, proceed to Checkout. You will be redirected to Stripe.
6. Complete payment using test cards (e.g., 4242 4242 4242 4242, any future date, any CVC, any ZIP).

### Products and Pricing in Stripe

You can use inline `price_data` (already implemented) or refer to pre-created Prices.

#### Option A: Inline price_data (no dashboard setup needed)
- The frontend sends each cart item with `price_data` (currency, product_data, unit_amount) and `quantity`.
- Good for prototyping and dynamic pricing.

#### Option B: Pre-created Products and Prices (recommended for production)
1. In the Stripe Dashboard → Products → New product
   - Name, description, and optionally images
2. Under the product, create a Price
   - Currency (USD), pricing model (standard), and unit amount (in dollars)
   - Save and note the `price_...` ID
3. Repeat for all products you plan to sell
4. Update the client to send `lineItems` like:
   ```json
   [{ "price": "price_123", "quantity": 2 }]
   ```
5. The `checkout.js` Netlify function accepts both formats – it will pass Prices directly if a `price` is provided, otherwise it will construct inline `price_data`.

#### Testing Pricing
- Use low test prices (e.g., $1.00) and Stripe test cards
- Verify totals in the Stripe-hosted Checkout and Dashboard events/logs

### Webhook Events

- We verify webhooks using the raw request body and `STRIPE_WEBHOOK_SECRET`.
- The handler logs details for `checkout.session.completed`.
- Add business logic at the marked location (fulfillment, notifications, DB writes).

## 🧭 Frontend Notes

- Set `window.STRIPE_PUBLISHABLE_KEY` via an inline script injected at deploy time to enable `redirectToCheckout` fallback if `url` isn’t returned.
- Product pages use `product.html?id=...` and share a demo dataset.

## 🚀 Deployment (Netlify)

1. Push to a Git repository and connect to Netlify.
2. In Netlify UI → Site settings → Build & deploy:
   - Build command: `npm run build`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
3. Environment variables: add your Stripe keys and webhook secret.
4. Deploy; configure custom domain if desired.

## 🧪 Testing Checklist

- Filtering/sorting works and accessible focus states are visible
- Cart add/remove/quantity updates and totals
- Checkout session creation and redirect to Stripe works
- Webhook receives `checkout.session.completed` and logs the session
- Success/Cancel pages render

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

MIT

---

Built with ❤️ for Juic'E Drinks 