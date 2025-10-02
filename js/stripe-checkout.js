// stripe-checkout.js - Unified Stripe Checkout Handler
// Consolidated Stripe payment processing with proper state management

// ================= Configuration =================

const STRIPE_CONFIG = {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || window.STRIPE_PUBLISHABLE_KEY,
    apiEndpoint: '/api/create-checkout-session',
    successUrl: '/success.html',
    cancelUrl: '/cancel.html'
};

// ================= State Management =================

let isProcessingCheckout = false;

// ================= Customer Validation =================

/**
 * Validate customer information before proceeding to checkout
 * @returns {Object} Validation result with success status and errors
 */
function validateCustomerInfo() {
    const errors = [];
    
    // Get form values
    const name = document.getElementById('checkout-name')?.value.trim() || '';
    const phone = document.getElementById('checkout-phone')?.value.trim() || '';
    const email = document.getElementById('checkout-email')?.value.trim() || '';
    const address = document.getElementById('checkout-address')?.value.trim() || '';
    const city = document.getElementById('checkout-city')?.value.trim() || '';
    const zip = document.getElementById('checkout-zip')?.value.trim() || '';

    // Validate required fields
    if (!name) errors.push('Full name is required');
    if (!phone) errors.push('Phone number is required');
    if (!email) errors.push('Email address is required');
    if (!address) errors.push('Street address is required');
    if (!city) errors.push('City is required');
    if (!zip) errors.push('ZIP code is required');

    // Validate formats
    const phonePattern = /^\d{10}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const zipPattern = /^\d{5}(-\d{4})?$/;

    if (phone && !phonePattern.test(phone)) {
        errors.push('Phone number must be 10 digits');
    }
    if (email && !emailPattern.test(email)) {
        errors.push('Invalid email format');
    }
    if (zip && !zipPattern.test(zip)) {
        errors.push('Invalid ZIP code format');
    }

    // Check cart requirements
    const cart = getCartData();
    if (!cart || cart.length === 0) {
        errors.push('Your cart is empty');
    } else {
        const totalBottles = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalBottles < 4) {
            errors.push('Minimum order is 4 bottles');
        }
    }

    // Check delivery validation
    if (typeof window.isDeliveryValidated === 'function' && !window.isDeliveryValidated()) {
        errors.push('Please validate your delivery address');
    }

    return {
        success: errors.length === 0,
        errors: errors
    };
}

// ================= Cart Data Processing =================

/**
 * Get cart data from global cart or localStorage
 * @returns {Array} Cart items array
 */
function getCartData() {
    // Try to get from global cart first
    if (typeof window.cart !== 'undefined' && Array.isArray(window.cart)) {
        return window.cart;
    }
    
    // Fallback to localStorage
    try {
        const stored = localStorage.getItem('cart');
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error('Error reading cart from localStorage:', err);
        return [];
    }
}

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
 * @returns {Object} Stripe instance
 */
function initializeStripe() {
    if (typeof Stripe === 'undefined') {
        throw new Error('Stripe.js not loaded. Please ensure Stripe script is included.');
    }
    
    return new Stripe(STRIPE_CONFIG.publishableKey);
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
    const stripe = initializeStripe();
    
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

        // Redirect to Stripe checkout
        await redirectToStripeCheckout(sessionData.sessionId);

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
}

// ================= Initialization =================

/**
 * Initialize Stripe checkout system
 */
function initializeStripeCheckout() {
    // Store original button text
    storeOriginalButtonText();
    
    // Initialize button event listeners
    initializeCheckoutButtons();
    
    // Log initialization
    console.log('Stripe checkout initialized with key:', STRIPE_CONFIG.publishableKey);
}

// ================= Global Exports =================

// Expose main functions globally
window.initiateCheckout = initiateCheckout;
window.validateCustomerInfo = validateCustomerInfo;
window.initializeStripeCheckout = initializeStripeCheckout;

// ================= Single Initialization =================

document.addEventListener('DOMContentLoaded', initializeStripeCheckout);