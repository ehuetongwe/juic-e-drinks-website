// pricing.js - Consolidated Version
// Unified pricing system with tiered pricing configuration

// ================= Pricing Configuration =================

const PRICING_CONFIG = {
    tiers: [
        { maxBottles: 5, price: 7.99 },
        { maxBottles: 11, price: 7.75 },
        { maxBottles: Infinity, price: 7.50 }
    ],
    products: {
        refresher: { basePrice: 7.99 },
        reboot: { basePrice: 7.99 },
        "Island Zing": { basePrice: 7.99 }
    }
};

// ================= Main Pricing Functions =================

/**
 * Main pricing function - determines tiered price per bottle based on total quantity
 * @param {number} totalBottles - Total number of bottles in cart + current selection
 * @returns {number} Price per bottle based on tier
 */
function getTieredPricePerBottle(totalBottles) {
    const tier = PRICING_CONFIG.tiers.find(t => totalBottles <= t.maxBottles);
    return tier ? tier.price : PRICING_CONFIG.tiers[0].price;
}

/**
 * Calculate total price for a given quantity using tiered pricing
 * @param {number} quantity - Number of bottles
 * @param {number} totalBottles - Total bottles in cart (for tier calculation)
 * @returns {number} Total price for the quantity
 */
function calculateItemTotalPrice(quantity, totalBottles = 0) {
    const pricePerBottle = getTieredPricePerBottle(totalBottles);
    return quantity * pricePerBottle;
}

/**
 * Calculate price for a specific product and quantity
 * @param {string} productId - Product identifier
 * @param {number} quantity - Number of bottles
 * @param {number} totalBottles - Total bottles in cart (for tier calculation)
 * @returns {number} Total price for the product
 */
function calculateProductPrice(productId, quantity, totalBottles = 0) {
    const product = PRICING_CONFIG.products[productId];
    if (!product) return 0;

    const unitPrice = getTieredPricePerBottle(totalBottles);
    return unitPrice * quantity;
}

// ================= UI Update Functions =================

/**
 * Updates all "Add to Cart" button text dynamically based on quantity and pricing
 */
function updateDynamicPrices() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        const productId = button.dataset.productId;
        const quantityElement = document.querySelector(`#${productId}-qty`);
        const quantity = parseInt(quantityElement ? quantityElement.textContent : "0") || 0;
        const totalBottles = calculateCartBottleCount() + quantity;

        const pricePerBottle = getTieredPricePerBottle(totalBottles);

        button.textContent = quantity > 0
            ? `Add to Cart – $${pricePerBottle.toFixed(2)}`
            : 'Add to Cart';
    });
}

/**
 * Update pricing display for a specific product
 * @param {string} productId - Product identifier
 * @param {number} quantity - Current quantity
 */
function updateProductPricing(productId, quantity) {
    const totalBottles = calculateCartBottleCount() + quantity;
    const pricePerBottle = getTieredPricePerBottle(totalBottles);
    
    // Update button text
    const button = document.querySelector(`[data-product-id="${productId}"]`);
    if (button) {
        button.textContent = quantity > 0
            ? `Add to Cart – $${pricePerBottle.toFixed(2)}`
            : 'Add to Cart';
    }
    
    // Update any price display elements
    const priceElement = document.querySelector(`#${productId}-price`);
    if (priceElement) {
        priceElement.textContent = `$${pricePerBottle.toFixed(2)}`;
    }
}

// ================= Cart Integration =================

/**
 * Calculate total bottles currently in cart
 * @returns {number} Total bottle count in cart
 */
function calculateCartBottleCount() {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    return savedCart.reduce((total, item) => {
        // Only count non-cleanse items for tier calculation
        return item.isCleanse ? total : total + item.quantity;
    }, 0);
}

/**
 * Get pricing information for display purposes
 * @param {number} quantity - Quantity to price
 * @returns {Object} Pricing information object
 */
function getPricingInfo(quantity) {
    const totalBottles = calculateCartBottleCount() + quantity;
    const pricePerBottle = getTieredPricePerBottle(totalBottles);
    const totalPrice = pricePerBottle * quantity;
    
    return {
        pricePerBottle,
        totalPrice,
        totalBottles,
        tier: PRICING_CONFIG.tiers.find(t => totalBottles <= t.maxBottles)
    };
}

// ================= Legacy Support (Deprecated) =================

/**
 * @deprecated Use getTieredPricePerBottle() instead
 * Legacy function for backward compatibility
 */
function getDynamicPrice(param) {
    let totalBottles;
    if (typeof param === 'string') {
        // legacy call style getDynamicPrice('refresher')
        totalBottles = calculateCartBottleCount();
    } else {
        totalBottles = param || 0;
    }
    return getTieredPricePerBottle(totalBottles);
}

// ================= Global Exports =================

// Expose main functions globally
window.getTieredPricePerBottle = getTieredPricePerBottle;
window.calculateItemTotalPrice = calculateItemTotalPrice;
window.calculateProductPrice = calculateProductPrice;
window.updateDynamicPrices = updateDynamicPrices;
window.updateProductPricing = updateProductPricing;
window.calculateCartBottleCount = calculateCartBottleCount;
window.getPricingInfo = getPricingInfo;

// Legacy support
window.getDynamicPrice = getDynamicPrice;