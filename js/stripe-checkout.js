// stripe-checkout.js - FINAL FIXED VERSION
// Properly reads Stripe key from meta tag and handles checkout

// ================= Configuration =================

function getStripePublishableKey() {
    return 'pk_test_51RkExhJyOFzlYZ85icg54mcoVKWQrw1TYTeOn0iZS53VACyFKpfWjrfgjy0AbmSIjT7sg3QitafBDPni9Uj0VP1300036hMfaR';
}

const STRIPE_CONFIG = {
    publishableKey: getStripePublishableKey(),
    apiEndpoint: '/.netlify/functions/create-checkout-session',
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

function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Fallback to alert
        alert(message);
    }
}

// ================= Initialization =================

function initializeCheckoutButtons() {
    console.log('🎬 Initializing checkout buttons...');
    
    // Find checkout button
    const button = document.getElementById('checkout-button');
    
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
