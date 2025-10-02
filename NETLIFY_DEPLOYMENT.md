# 🚀 Netlify Deployment Guide for Juic'E Drinks

## ✅ Pre-Deployment Checklist

### 1. **Stripe Account Setup**
- [ ] Create Stripe account at [stripe.com](https://stripe.com)
- [ ] Get your **Publishable Key** (starts with `pk_`)
- [ ] Get your **Secret Key** (starts with `sk_`)
- [ ] Test keys in Stripe Dashboard

### 2. **Netlify Account Setup**
- [ ] Create Netlify account at [netlify.com](https://netlify.com)
- [ ] Connect your GitHub repository
- [ ] Set up custom domain (optional)

## 🔧 Deployment Steps

### Step 1: Connect Repository
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Choose your repository: `Juic'E Drinks website test`
4. Set build settings:
   - **Build command**: Leave empty (static site)
   - **Publish directory**: `.` (root directory)
   - **Functions directory**: `netlify-functions`

### Step 2: Configure Environment Variables
In Netlify Dashboard → Site settings → Environment variables:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | Your Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` | Your Stripe publishable key |

### Step 3: Deploy
1. Click "Deploy site"
2. Wait for build to complete
3. Test the checkout functionality

## 🧪 Testing Your Deployment

### Test Checkout Flow
1. Add items to cart
2. Click "Checkout with Stripe"
3. Verify redirect to Stripe Checkout
4. Complete test payment
5. Verify redirect to success page

### Test Error Handling
1. Try checkout with empty cart
2. Test with invalid items
3. Verify error messages display correctly

## 🔍 Troubleshooting

### Common Issues

#### 1. "Stripe configuration missing" Error
**Solution**: Check that `STRIPE_SECRET_KEY` is set in Netlify environment variables

#### 2. CORS Errors
**Solution**: The function already includes CORS headers, but verify the request is going to `/.netlify/functions/create-checkout-session`

#### 3. 404 on Function Calls
**Solution**: 
- Verify `netlify.toml` is in root directory
- Check function is in `netlify-functions/` directory
- Ensure function file is named correctly

#### 4. Payment Processing Fails
**Solution**:
- Verify Stripe keys are correct
- Check Stripe Dashboard for errors
- Ensure you're using test keys for testing

## 📁 File Structure After Deployment

```
your-site.netlify.app/
├── index.html                 # Main page
├── success.html              # Payment success page
├── cancel.html               # Payment cancelled page
├── css/styles.css            # Styles
├── js/                       # JavaScript files
├── assets/                   # Images
├── netlify-functions/        # Serverless functions
│   ├── create-checkout-session.js
│   └── package.json
└── netlify.toml             # Netlify configuration
```

## 🔐 Security Notes

- ✅ Stripe secret key is server-side only
- ✅ CORS is properly configured
- ✅ Input validation is implemented
- ✅ Error handling is in place

## 📞 Support

If you encounter issues:
1. Check Netlify function logs in Dashboard
2. Verify Stripe Dashboard for payment errors
3. Test with Stripe test mode first
4. Contact support with specific error messages

## 🎯 Go Live Checklist

Before going live:
- [ ] Switch to Stripe live keys
- [ ] Test with real payment method
- [ ] Verify success/cancel page redirects
- [ ] Test delivery fee calculation
- [ ] Verify all images load correctly
- [ ] Test mobile responsiveness
- [ ] Check Google Maps API key (if using delivery calculator) 