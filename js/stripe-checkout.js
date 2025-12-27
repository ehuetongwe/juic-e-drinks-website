// stripe-checkout.js - FINAL FIXED VERSION
// Properly reads Stripe key from meta tag and handles checkout

// ================= Configuration =================

/**
 * Get Stripe publishable key from meta tag or environment
 * @returns {string} Stripe publishable key
 */
function getStripePublishableKey() {
    // Try to get from meta tag first (for Netlify deployment)
    const metaTag = document.querySelector('meta[name="stripe-publishable-key"]');
    if (metaTag && metaTag.content && !metaTag.content.includes('${')) {
        return metaTag.content;
    }
    
    // Fallback to window variable (if set by build process)
    if (window.STRIPE_PUBLISHABLE_KEY) {
        return window.STRIPE_PUBLISHABLE_KEY;
    }
    
    // Fallback to environment variable (for local development with build tools)
    if (typeof process !== 'undefined' && process.env && process.env.STRIPE_PUBLISHABLE_KEY) {
        return process.env.STRIPE_PUBLISHABLE_KEY;
    }
    
    console.error('Stripe publishable key not found. Please set it in the meta tag or environment variable.');
    return null;
}

const STRIPE_CONFIG = {
    get publishableKey() {
        return getStripePublishableKey();
    },
    apiEndpoint: '/api/create-checkout-session',
    successUrl: window.location.origin + '/success.html',
    cancelUrl: window.location.origin + '/cancel.html'
};

let isProcessingCheckout = false;

// ================= Main Checkout Function =================

async function initiateCheckout() {
    console.log('🛒 Checkout initiated');
    
    if (isProcessingCheckout) {
        console.log('⏳ Already processing...');
        showNotification('Checkout already in progress...', 'info');
        return;
    }
    
    try {
        isProcessingCheckout = true;
        
        // Get button and update state
        const button = document.getElementById('checkout-button') || 
                      document.querySelector('button:contains("Checkout")') ||
                      event?.target;
        
        if (button) {
            button.disabled = true;
            button.textContent = 'Processing...';
            button.style.opacity = '0.6';
        }
        
        console.log('1️⃣ Validating customer info...');
        
        // Validate
        const validation = validateCheckout();
        if (!validation.success) {
            showNotification('❌ ' + validation.errors.join('\n'), 'error');
            console.error('Validation failed:', validation.errors);
            return;
        }
        
        console.log('2️⃣ Getting cart data...');
        
        // Get cart
        const cart = getCartData();
        if (!cart || cart.length === 0) {
            showNotification('❌ Your cart is empty', 'error');
            return;
        }
        
        console.log('Cart items:', cart);
        
        // Calculate prices
        const totalSingleBottles = cart.reduce((sum, item) => 
            item.isCleanse ? sum : sum + item.quantity, 0
        );
        const sharedUnitPrice = typeof window.getTieredPricePerBottle === 'function'
            ? window.getTieredPricePerBottle(totalSingleBottles)
            : 7.99;
        
        console.log('3️⃣ Building line items...');
        
        // Build items
        const items = cart.map(item => {
            const unitPrice = item.isCleanse ? item.price : sharedUnitPrice;
            return {
                name: item.name,
                price: unitPrice,
                quantity: item.quantity
            };
        });
        
        console.log('Items for Stripe:', items);
        
        const deliveryFee = window.deliveryFee || 0;
        const customerEmail = document.getElementById('checkout-email')?.value.trim() || '';
        
        console.log('Delivery fee:', deliveryFee);
        console.log('Customer email:', customerEmail);
        
        console.log('4️⃣ Creating Stripe session...');
        
        // Create session
        const response = await fetch(STRIPE_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: items,
                delivery_fee: deliveryFee,
                customer_email: customerEmail,
                metadata: {
                    site: 'JuicE Drinks',
                    timestamp: new Date().toISOString()
                }
            })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Session created:', data);
        
        if (!data.sessionId) {
            throw new Error('No session ID returned from server');
        }
        
        console.log('5️⃣ Redirecting to Stripe...');
        console.log('Using Stripe key:', STRIPE_CONFIG.publishableKey.substring(0, 20) + '...');
        
        // Initialize Stripe
        if (typeof Stripe === 'undefined') {
            throw new Error('Stripe.js not loaded. Please refresh the page.');
        }
        
        const stripe = Stripe(STRIPE_CONFIG.publishableKey);
        
        // Redirect
        const { error } = await stripe.redirectToCheckout({
            sessionId: data.sessionId
        });
        
        if (error) {
            throw new Error(error.message);
        }
        
    } catch (error) {
        console.error('❌ Checkout error:', error);
        showNotification('❌ Checkout failed: ' + error.message, 'error');
        
    } finally {
        isProcessingCheckout = false;
        
        // Re-enable button
        const button = document.getElementById('checkout-button') || 
                      document.querySelector('button:contains("Checkout")');
        if (button) {
            button.disabled = false;
            button.textContent = 'Checkout with Stripe';
            button.style.opacity = '1';
        }
    }
}

// ================= Validation =================

function validateCheckout() {
    const errors = [];
    
    // Check delivery validation
    if (!window.deliveryValidated) {
        errors.push('Please validate your delivery address first');
    }
    
    // Check form fields
    const name = document.getElementById('checkout-name')?.value.trim();
    const phone = document.getElementById('checkout-phone')?.value.trim();
    const email = document.getElementById('checkout-email')?.value.trim();
    const address = document.getElementById('checkout-address')?.value.trim();
    const city = document.getElementById('checkout-city')?.value.trim();
    const zip = document.getElementById('checkout-zip')?.value.trim();
    
    if (!name) errors.push('Please enter your full name');
    if (!phone) errors.push('Please enter your phone number');
    if (!email) errors.push('Please enter your email address');
    if (!address) errors.push('Please enter your street address');
    if (!city) errors.push('Please enter your city');
    if (!zip) errors.push('Please enter your ZIP code');
    
    // Validate formats
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
        errors.push('Please enter a valid 10-digit phone number');
    }
    
    // Check cart
    const cart = getCartData();
    if (!cart || cart.length === 0) {
        errors.push('Your cart is empty');
    } else {
        const totalBottles = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalBottles < 4) {
            errors.push('Minimum order is 4 bottles');
        }
    }
    
    return {
        success: errors.length === 0,
        errors: errors
    };
}

// ================= Helpers =================

function getCartData() {
    // Try global cart
    if (typeof window.cart !== 'undefined' && Array.isArray(window.cart)) {
        return window.cart;
    }
    
    // Try localStorage
    try {
        const stored = localStorage.getItem('cart');
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error('Error reading cart:', err);
        return [];
    }
}

<<<<<<< HEAD
function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Fallback to alert
        alert(message);
    }
=======
/**
 * Build line items for Stripe checkout from cart data
 * @param {Array} cart - Cart items array
 * @returns {Array} Stripe line items array
 */
function buildLineItemsFromCart(cart) {
    if (!Array.isArray(cart) || cart.length === 0) return [];
    
    // Calculate shared unit price for tiered pricing
    const totalSingleBottles = cart.reduce((sum, item) => 
        item.isCleanse ? sum : sum + item.quantity, 0
    );
    
    const sharedUnitPrice = (typeof window.getCartUnitPrice === 'function')
        ? window.getCartUnitPrice(totalSingleBottles)
        : (totalSingleBottles >= 12 ? 7.50 : totalSingleBottles >= 6 ? 7.75 : 7.99);

    return cart.map(item => {
        const unitPrice = item.isCleanse ? item.price : sharedUnitPrice;
        return {
            price_data: {
                currency: 'usd',
                product_data: { 
                    name: item.name,
                    description: item.isCleanse ? 'Cleanse Bundle' : 'Individual Juice'
                },
                unit_amount: Math.round(unitPrice * 100) // Convert to cents
            },
            quantity: item.quantity
        };
    });
}

// ================= Stripe Integration =================

/**
 * Initialize Stripe with publishable key
 * Waits for Stripe.js to load if deferred
 * @returns {Object} Stripe instance
 */
async function initializeStripe() {
    // Wait for Stripe.js to load if it's deferred
    if (typeof Stripe === 'undefined') {
        // Wait up to 5 seconds for Stripe to load
        let attempts = 0;
        while (typeof Stripe === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof Stripe === 'undefined') {
            throw new Error('Stripe.js not loaded. Please ensure Stripe script is included.');
        }
    }
    
    const publishableKey = STRIPE_CONFIG.publishableKey;
    if (!publishableKey) {
        throw new Error('Stripe publishable key is not configured. Please set STRIPE_PUBLISHABLE_KEY in your environment variables or meta tag.');
    }
    
    // Validate key format
    if (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
        console.error('Invalid Stripe publishable key format. Key should start with pk_test_ or pk_live_');
        console.error('Current key value:', publishableKey.substring(0, 20) + '...');
        throw new Error('Invalid Stripe publishable key format. Please check your STRIPE_PUBLISHABLE_KEY configuration.');
    }
    
    try {
        return new Stripe(publishableKey);
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        throw new Error('Failed to initialize Stripe. Please check your publishable key.');
    }
}

/**
 * Create checkout session with Stripe
 * @param {Array} items - Cart items
 * @param {number} deliveryFee - Delivery fee amount
 * @param {string} customerEmail - Customer email
 * @returns {Promise<Object>} Checkout session data
 */
async function createCheckoutSession(items, deliveryFee = 0, customerEmail = '') {
    const response = await fetch(STRIPE_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            items,
            delivery_fee: deliveryFee,
            customer_email: customerEmail,
            metadata: { site: 'JuicE Drinks', time: Date.now() }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Redirect to Stripe checkout
 * @param {string} sessionId - Stripe session ID
 */
async function redirectToStripeCheckout(sessionId) {
    const stripe = await initializeStripe();
    
    const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId
    });

    if (error) {
        throw new Error(error.message);
    }
}

// ================= Main Checkout Function =================

/**
 * Main checkout function - handles the complete checkout process
 */
async function initiateCheckout() {
    // Prevent multiple simultaneous checkouts
    if (isProcessingCheckout) {
        if (typeof window.showNotification === 'function') {
            window.showNotification('Checkout already in progress...', 'info');
        }
        return;
    }

    try {
        isProcessingCheckout = true;
        
        // Update button state
        updateCheckoutButtons(true);

        // Validate customer information
        const validation = validateCustomerInfo();
        if (!validation.success) {
            const errorMessage = validation.errors.join('. ') + '.';
            if (typeof window.showNotification === 'function') {
                window.showNotification(errorMessage, 'error');
            }
            return;
        }

        // Get cart data
        const cart = getCartData();
        if (!cart || cart.length === 0) {
            if (typeof window.showNotification === 'function') {
                window.showNotification('Your cart is empty. Please add items before checkout.', 'error');
            }
            return;
        }

        // Get customer email
        const customerEmail = document.getElementById('checkout-email')?.value.trim() || '';

        // Get delivery fee
        const deliveryFee = typeof window.getDeliveryFee === 'function' ? window.getDeliveryFee() : 0;

        // Build items for checkout
        const items = cart.map(item => ({
            name: item.name,
            price: item.isCleanse ? item.price : (typeof window.getCartUnitPrice === 'function' ? window.getCartUnitPrice(cart.reduce((sum, i) => i.isCleanse ? sum : sum + i.quantity, 0)) : 7.99),
            quantity: item.quantity
        }));

        // Show processing notification
        if (typeof window.showNotification === 'function') {
            window.showNotification('Processing checkout...', 'info');
        }

        // Create checkout session
        const sessionData = await createCheckoutSession(items, deliveryFee, customerEmail);

        if (!sessionData.sessionId) {
            throw new Error('Invalid response from checkout service');
        }

        // Try to redirect using Stripe.js, fallback to direct URL if it fails
        try {
            await redirectToStripeCheckout(sessionData.sessionId);
        } catch (redirectError) {
            console.warn('Stripe.js redirect failed, using direct URL:', redirectError);
            // Fallback: use the session URL directly if provided
            if (sessionData.url) {
                window.location.href = sessionData.url;
            } else {
                // Last resort: construct the checkout URL
                window.location.href = `https://checkout.stripe.com/c/pay/${sessionData.sessionId}`;
            }
        }

    } catch (error) {
        console.error('Checkout error:', error);
        
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Checkout failed: ${error.message}`, 'error');
        }
    } finally {
        isProcessingCheckout = false;
        updateCheckoutButtons(false);
    }
}

// ================= UI Management =================

/**
 * Update checkout button states
 * @param {boolean} processing - Whether checkout is processing
 */
function updateCheckoutButtons(processing) {
    const buttonIds = ['checkout-button', 'card-pay-btn', 'checkout-btn'];
    
    buttonIds.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = processing;
            button.textContent = processing ? 'Processing...' : button.dataset.originalText || 'Checkout with Stripe';
            
            if (processing) {
                button.classList.add('processing');
            } else {
                button.classList.remove('processing');
            }
        }
    });
}

/**
 * Store original button text for restoration
 */
function storeOriginalButtonText() {
    const buttonIds = ['checkout-button', 'card-pay-btn', 'checkout-btn'];
    
    buttonIds.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button && !button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }
    });
}

// ================= Event Handlers =================

/**
 * Handle checkout button clicks
 * @param {Event} event - Click event
 */
function handleCheckoutClick(event) {
    event.preventDefault();
    event.stopPropagation();
    initiateCheckout();
}

/**
 * Initialize all checkout button event listeners
 */
function initializeCheckoutButtons() {
    const buttonIds = ['checkout-button', 'card-pay-btn', 'checkout-btn'];
    
    buttonIds.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            // Remove any existing listeners
            button.removeEventListener('click', handleCheckoutClick);
            // Add new listener
            button.addEventListener('click', handleCheckoutClick);
        }
    });
>>>>>>> ee3db59 (Fix Stripe redirect URLs for juicedrinks.biz)
}

// ================= Initialization =================

function initializeCheckoutButtons() {
    console.log('🎬 Initializing checkout buttons...');
    
    // Find checkout button
    const button = document.getElementById('checkout-button');
    
<<<<<<< HEAD
    if (button) {
        console.log('✅ Found checkout button');
        
        // Remove old listener
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add new listener
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 Checkout button clicked');
            initiateCheckout();
        });
    } else {
        console.warn('⚠️ Checkout button not found');
=======
    // Log initialization with key validation
    const key = STRIPE_CONFIG.publishableKey;
    if (key) {
        // Only show first 20 chars for security
        const keyPreview = key.substring(0, 20) + '...';
        console.log('✅ Stripe checkout initialized with key:', keyPreview);
    } else {
        console.error('❌ Stripe checkout initialized but NO PUBLISHABLE KEY FOUND!');
        console.error('   Please set STRIPE_PUBLISHABLE_KEY in environment variables or meta tag.');
>>>>>>> ee3db59 (Fix Stripe redirect URLs for juicedrinks.biz)
    }
}

// Make globally available
window.initiateCheckout = initiateCheckout;
window.validateCheckout = validateCheckout;

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCheckoutButtons);
} else {
    initializeCheckoutButtons();
}

// Reinitialize after delay for dynamic content
setTimeout(initializeCheckoutButtons, 1000);

console.log('✅ Stripe checkout system loaded');
console.log('🔑 Using publishable key:', STRIPE_CONFIG.publishableKey?.substring(0, 20) + '...');
