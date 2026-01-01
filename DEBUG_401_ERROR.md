# 🔍 Debugging 401 Unauthorized Error

## The Problem
You're getting a `401 (Unauthorized)` error when trying to access the Stripe checkout page. This means your **publishable key** and **secret key** don't match.

## ✅ Critical Check: Keys Must Match!

Your publishable key (`pk_test_...`) and secret key (`sk_test_...`) **MUST** be from the **same Stripe account** and **same mode** (both test or both live).

### How to Verify:

1. **Check your publishable key** (in `index.html` line 8):
   - Should start with `pk_test_` (for test mode)
   - Example: `pk_test_51RkExh...`

2. **Check your secret key** (in Netlify environment variables):
   - Should start with `sk_test_` (for test mode) 
   - Should be from the **SAME Stripe account** as your publishable key

3. **Get both keys from Stripe Dashboard**:
   - Go to https://dashboard.stripe.com
   - Click "Developers" → "API keys"
   - Make sure you're in **Test mode** (toggle in top right)
   - Copy BOTH keys from the same page

## 🔧 Quick Fix Steps

### Step 1: Verify Your Keys Match

1. Open Stripe Dashboard → Developers → API keys
2. Make sure you're in **Test mode** (not Live mode)
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)
5. Verify they're from the same account

### Step 2: Update Frontend Key

1. Open `index.html`
2. Line 8 should have your publishable key:
   ```html
   <meta name="stripe-publishable-key" content="pk_test_YOUR_KEY_HERE">
   ```
3. Make sure it matches the key from Stripe Dashboard

### Step 3: Update Backend Key (Netlify)

**For Local Development:**
1. Create a `.env` file in your project root
2. Add:
   ```
   STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
   ```

**For Netlify Production:**
1. Go to Netlify Dashboard → Your Site → Site settings → Environment variables
2. Add or update:
   - Key: `STRIPE_SECRET_KEY`
   - Value: `sk_test_YOUR_SECRET_KEY_HERE` (must match the account of your publishable key)

### Step 4: Test Again

1. Save all files
2. Restart your local server (if testing locally)
3. Clear browser cache
4. Try checkout again

## 🧪 Debugging in Browser Console

Open browser DevTools (F12) → Console, and check:

1. **Key loaded correctly?**
   ```
   ✅ Stripe publishable key loaded from meta tag: pk_test_51RkExh...
   ```

2. **Key format valid?**
   - Should start with `pk_test_` or `pk_live_`
   - Should be about 100+ characters long

3. **Any errors?**
   - If you see "Invalid Stripe publishable key format" → Key is wrong
   - If you see "Stripe publishable key not found" → Key not set

## ⚠️ Common Mistakes

1. **Mixing test and live keys**
   - ❌ `pk_test_...` with `sk_live_...`
   - ✅ `pk_test_...` with `sk_test_...`

2. **Using keys from different accounts**
   - ❌ Publishable key from Account A, Secret key from Account B
   - ✅ Both keys from the same Stripe account

3. **Key not fully copied**
   - Make sure you copied the entire key (100+ characters)
   - No extra spaces or line breaks

4. **Using old/revoked keys**
   - If you regenerated keys, make sure you're using the new ones
   - Old keys will cause 401 errors

## 🔄 What I Fixed

1. **Moved key initialization** before Stripe.js loads
2. **Added better error logging** to help debug
3. **Added fallback** to use session URL directly if redirect fails
4. **Improved key validation** with clearer error messages

## 📝 Next Steps

After ensuring your keys match:

1. **Save the file** (Cmd+S / Ctrl+S)
2. **Refresh your browser** (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
3. **Check the console** for the key loading message
4. **Try checkout again**

If you still get a 401 error after verifying keys match, check:
- Netlify function logs (Dashboard → Functions → View logs)
- Browser Network tab to see the exact request that's failing
- Stripe Dashboard → Developers → Logs to see API errors

---

**Remember**: The publishable key and secret key MUST be from the same Stripe account and same mode (test/live)!

