# Troubleshooting Guide - Juic'E Drinks E-commerce

## 🚨 Common Issues & Solutions

### Local Development Issues

#### 1. Netlify CLI Not Working
**Problem**: `netlify dev` command not found or fails
**Solution**:
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Or use npx
npx netlify-cli dev

# Verify installation
netlify --version
```

#### 2. Functions Not Loading
**Problem**: Netlify functions return 404 or don't work locally
**Solution**:
```bash
# Check function directory structure
ls -la netlify/functions/

# Ensure functions have proper exports
# Each function should export a handler function

# Test function locally
netlify functions:invoke checkout --payload '{"lineItems":[{"price":"price_123","quantity":1}]}'
```

#### 3. Environment Variables Not Loading
**Problem**: Functions can't access environment variables
**Solution**:
```bash
# Create .env file in root directory
cp .env.example .env

# Fill in your actual Stripe keys
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Restart Netlify dev server
netlify dev
```

### Stripe Integration Issues

#### 1. Checkout Session Creation Fails
**Problem**: POST to `/.netlify/functions/checkout` returns error
**Debugging**:
```bash
# Check function logs
netlify functions:logs

# Test function directly
curl -X POST http://localhost:8888/.netlify/functions/checkout \
  -H "Content-Type: application/json" \
  -d '{"lineItems":[{"price_data":{"currency":"usd","product_data":{"name":"Test"},"unit_amount":1000},"quantity":1}]}'
```

**Common Causes**:
- Missing `STRIPE_SECRET_KEY` environment variable
- Invalid Stripe key format
- Malformed request payload
- Stripe account restrictions

#### 2. Webhook Not Receiving Events
**Problem**: Stripe webhooks not reaching your endpoint
**Debugging**:
```bash
# Start webhook forwarding
stripe listen --forward-to localhost:8888/.netlify/functions/webhook

# Check webhook endpoint secret matches
echo $STRIPE_WEBHOOK_SECRET
```

**Common Causes**:
- Webhook endpoint URL incorrect
- Webhook secret mismatch
- Stripe CLI not forwarding to correct port
- Function not handling POST requests

#### 3. Stripe Redirect Not Working
**Problem**: User not redirected to Stripe Checkout
**Debugging**:
```javascript
// Check browser console for errors
// Verify Stripe publishable key is set
console.log('Stripe Key:', window.STRIPE_PUBLISHABLE_KEY);

// Check checkout response
console.log('Checkout Response:', response);
```

**Common Causes**:
- Missing `STRIPE_PUBLISHABLE_KEY`
- Invalid Stripe key
- CORS issues
- JavaScript errors preventing execution

### Frontend Issues

#### 1. Products Not Displaying
**Problem**: Product grid is empty
**Debugging**:
```javascript
// Check browser console
// Verify products array is populated
console.log('Products:', store.products);

// Check if displayProducts() is called
console.log('Products Grid:', document.getElementById('products-grid'));
```

**Common Causes**:
- JavaScript errors preventing store initialization
- DOM elements not found
- Products array empty or malformed

#### 2. Cart Not Working
**Problem**: Can't add items to cart or cart not persisting
**Debugging**:
```javascript
// Check localStorage
console.log('Cart from localStorage:', localStorage.getItem('juice-cart'));

// Check cart state
console.log('Current cart:', store.cart);

// Verify event listeners
console.log('Add to cart buttons:', document.querySelectorAll('.add-to-cart-btn'));
```

**Common Causes**:
- localStorage disabled or full
- JavaScript errors in cart functions
- Event listeners not attached
- Cart modal not found

#### 3. Filters Not Working
**Problem**: Search, category, or sort filters don't work
**Debugging**:
```javascript
// Check filter state
console.log('Current filters:', store.filters);

// Verify filter elements exist
console.log('Search input:', document.getElementById('search-input'));
console.log('Category select:', document.getElementById('category-select'));
console.log('Sort select:', document.getElementById('sort-select'));
```

**Common Causes**:
- Filter elements not found in DOM
- Event listeners not attached
- Filter logic errors
- Products array issues

### Performance Issues

#### 1. Slow Loading
**Problem**: Site takes too long to load
**Solutions**:
- Check network tab for slow requests
- Verify image sizes and formats
- Check for JavaScript blocking rendering
- Use browser dev tools Performance tab

#### 2. Functions Timeout
**Problem**: Netlify functions timeout (10s limit)
**Solutions**:
- Optimize function code
- Reduce external API calls
- Use caching where possible
- Check function logs for bottlenecks

## 🔧 Debugging Tools

### Browser Dev Tools
```javascript
// Access store instance
window.store

// Check error log
window.store.getErrorLog()

// Check analytics events
window.analyticsEvents

// Test functions manually
store.addToCart(1)
store.getFilteredProducts()
store.validateCart()
```

### Netlify CLI Commands
```bash
# View function logs
netlify functions:logs

# Test function locally
netlify functions:invoke functionName --payload '{"key":"value"}'

# List all functions
netlify functions:list

# View deployment logs
netlify logs
```

### Stripe CLI Commands
```bash
# Listen to webhooks
stripe listen --forward-to localhost:8888/.netlify/functions/webhook

# Test webhook endpoint
stripe trigger checkout.session.completed

# View webhook events
stripe events list
```

## 📱 Mobile-Specific Issues

### Touch Events Not Working
**Problem**: Mobile interactions don't work properly
**Solutions**:
- Add touch event handlers
- Test on actual mobile devices
- Check viewport meta tag
- Verify CSS touch-action properties

### Responsive Layout Issues
**Problem**: Layout breaks on mobile
**Solutions**:
- Test on various screen sizes
- Use browser dev tools device simulation
- Check CSS media queries
- Verify flexbox/grid properties

## 🚀 Deployment Issues

### Build Failures
**Problem**: Netlify build fails
**Solutions**:
- Check build logs in Netlify dashboard
- Verify build command in netlify.toml
- Check for syntax errors
- Ensure all dependencies are in package.json

### Environment Variables Not Set
**Problem**: Production functions can't access env vars
**Solutions**:
- Set environment variables in Netlify dashboard
- Verify variable names match code
- Check for typos in variable names
- Restart deployment after setting vars

### Function Deployment Issues
**Problem**: Functions not deployed or not working
**Solutions**:
- Check function directory in netlify.toml
- Verify function exports
- Check function logs in Netlify dashboard
- Test functions locally before deploying

## 📞 Getting Help

### Before Asking for Help
1. Check this troubleshooting guide
2. Review browser console for errors
3. Check Netlify function logs
4. Verify environment variables
5. Test locally with `netlify dev`

### Information to Include
- Error messages (exact text)
- Browser console logs
- Function logs from Netlify
- Steps to reproduce the issue
- Environment (local/production)
- Browser and OS versions

### Support Channels
- GitHub Issues (for code problems)
- Netlify Support (for deployment issues)
- Stripe Support (for payment issues)
- Browser Dev Tools (for frontend issues)

## 🔍 Performance Monitoring

### Key Metrics to Monitor
- Page load time
- Function response time
- Cart abandonment rate
- Checkout completion rate
- Error rates

### Tools for Monitoring
- Google Analytics
- Netlify Analytics
- Browser Dev Tools
- Stripe Dashboard
- Custom error logging

---

**Remember**: Most issues can be resolved by checking the browser console, verifying environment variables, and testing functions locally first.
