# 🔧 Quick Fix for Stripe 401 Error

## The Problem
The error `401 Unauthorized` from Stripe API means your publishable key is either:
- Missing
- Invalid
- Not being read correctly

The meta tag currently has: `${STRIPE_PUBLISHABLE_KEY}` which is a template variable that hasn't been replaced.

## ✅ Quick Fix Options

### Option 1: Set Key Directly in HTML (Fastest for Testing)

1. Open `index.html`
2. Find line 8:
   ```html
   <meta name="stripe-publishable-key" content="${STRIPE_PUBLISHABLE_KEY}">
   ```
3. Replace it with your actual Stripe test key:
   ```html
   <meta name="stripe-publishable-key" content="pk_test_YOUR_ACTUAL_KEY_HERE">
   ```
4. Save and refresh the page

### Option 2: Use URL Parameter (For Quick Testing)

Add your key as a URL parameter when testing:
```
http://localhost:8888/?stripe_key=pk_test_YOUR_KEY_HERE
```

The script will automatically detect and use it.

### Option 3: Set Environment Variable (For Production)

**For Local Development:**
1. Create a `.env` file in the project root
2. Add:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   ```
3. If using Netlify CLI, it will automatically load this

**For Netlify Production:**
1. Go to Netlify Dashboard → Your Site → Site settings → Environment variables
2. Add:
   - Key: `STRIPE_PUBLISHABLE_KEY`
   - Value: `pk_test_YOUR_KEY_HERE` (or `pk_live_...` for production)
3. Redeploy your site

## 🧪 How to Get Your Stripe Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click "Developers" → "API keys"
3. Copy your **Publishable key** (starts with `pk_test_` for test mode)
4. Use this key in one of the methods above

## ✅ Verify It's Working

1. Open browser DevTools (F12)
2. Go to Console tab
3. You should see:
   ```
   ✅ Stripe publishable key loaded from meta tag
   ✅ Stripe checkout initialized with key: pk_test_...
   ```
4. If you see errors, check:
   - Key starts with `pk_test_` or `pk_live_`
   - No extra spaces or quotes
   - Key is complete (not truncated)

## 🔍 Additional Fixes Applied

1. **CSP Updated**: Added `https://js.stripe.com` to `style-src` to allow Stripe's inline styles
2. **Better Error Messages**: Console will now show clear errors if key is missing/invalid
3. **Key Validation**: Script validates key format before using it

## ⚠️ Important Notes

- **Never commit your actual Stripe keys to Git**
- Use test keys (`pk_test_...`) for development
- Use live keys (`pk_live_...`) only in production environment variables
- The publishable key is safe to expose in client-side code (that's its purpose)

---

**After applying the fix, refresh your page and try checkout again!**

