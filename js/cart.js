// cart.js - Consolidated Version
// Complete cart management system with unified functions and proper tiered pricing

const CART_STORAGE_KEY = 'cart';

// Complete ID_MAP object for all products
const ID_MAP = {
    // Individual juice products
    'refresher': 'refresher',
    'reboot': 'reboot', 
    'Island Zing': 'island-zing',
    
    // Cleanse products (with flavor variants)
    '1-day-refresher': '1-day-refresher',
    '1-day-reboot': '1-day-reboot',
    '2-day-refresher': '2-day-refresher', 
    '2-day-reboot': '2-day-reboot',
    '3-day-refresher': '3-day-refresher',
    '3-day-reboot': '3-day-reboot',
    '5-day-refresher': '5-day-refresher',
    '5-day-reboot': '5-day-reboot',
    '7-day-refresher': '7-day-refresher',
    '7-day-reboot': '7-day-reboot'
};

// Product ID to DOM-safe ID mapping
function getDomSafeId(productId) {
    return ID_MAP[productId] || productId.toLowerCase().replace(/\s+/g, '-');
}

// Initialize cart from localStorage
let cart = loadCart() || [];

function loadCart() {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// ================= Core Cart Functions =================

function addToCart(productId, name, price, quantity) {
    // Fallback: if quantity not passed, read current DOM value
    if (quantity === undefined) {
        const qtyEl = document.getElementById(`${getDomSafeId(productId)}-qty`);
        quantity = parseInt(qtyEl ? qtyEl.textContent : '0') || 0;
    }
    
    if (quantity <= 0) {
        showNotification("Please select a quantity greater than 0.", "error");
        return;
    }

    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ productId, name, price, quantity });
    }

    saveCart();
    updateCartDisplay();
    showNotification(`${quantity} × ${name} added to cart!`, "success");
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    saveCart();
    updateCartDisplay();
}

function updateCartItemQuantity(productId, newQuantity) {
    const item = cart.find(item => item.productId === productId);
    if (!item) return;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
    } else {
        item.quantity = newQuantity;
        saveCart();
        updateCartDisplay();
    }
}

// ================= Unified Cart Display Function =================

function updateCartDisplay() {
    const cartContainer = document.getElementById('cart-items');
    const cartCountElem = document.getElementById('cart-count');
    const subtotalElem = document.getElementById('cart-subtotal');
    const totalElem = document.getElementById('cart-total');
    const minOrderWarn = document.getElementById('minimum-order-warning');

    if (!cartContainer) return; // Bail if modal/DOM not rendered yet

    // Clear current list
    cartContainer.innerHTML = '';

    // Empty cart handling
    if (cart.length === 0) {
        if (cartCountElem) cartCountElem.textContent = '0';
        if (subtotalElem) subtotalElem.textContent = '$0.00';
        if (totalElem) totalElem.textContent = '$0.00';
        if (minOrderWarn) minOrderWarn.style.display = 'none';
        updateCheckoutSummary();
        return;
    }

    let totalQuantity = 0;
    let subtotal = 0;

    // Determine shared unit price based on combined single-bottle count
    const totalSingleBottles = cart.reduce((sum, item) => item.isCleanse ? sum : sum + item.quantity, 0);
    const sharedUnitPrice = getCartUnitPrice(totalSingleBottles);

    // Build cart UI
    cart.forEach(item => {
        totalQuantity += item.quantity;
        const lineTotal = getLineTotal(item, sharedUnitPrice);
        subtotal += lineTotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${item.name} (x${item.quantity})`;
        nameSpan.className = 'cart-item-name';
        itemDiv.appendChild(nameSpan);

        const totalSpan = document.createElement('span');
        totalSpan.textContent = `$${lineTotal.toFixed(2)}`;
        totalSpan.className = 'cart-item-total';
        itemDiv.appendChild(totalSpan);

        cartContainer.appendChild(itemDiv);
    });

    // Update cart badge
    if (cartCountElem) {
        cartCountElem.textContent = totalQuantity.toString();
    }

    // Subtotal & total
    if (subtotalElem) subtotalElem.textContent = `$${subtotal.toFixed(2)}`;

    let totalAmount = subtotal;
    if (typeof window.deliveryFee === 'number') {
        totalAmount += window.deliveryFee;
    }
    if (totalElem) totalElem.textContent = `$${totalAmount.toFixed(2)}`;

    // Update checkout summary
    updateCheckoutSummary(subtotal, totalAmount, sharedUnitPrice);

    // Minimum order banner & Proceed button state
    const meetsMinOrder = totalQuantity >= 4;
    if (minOrderWarn) {
        minOrderWarn.style.display = meetsMinOrder ? 'none' : 'block';
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = !meetsMinOrder;
    }
}

// ================= Checkout Summary Update =================

function updateCheckoutSummary(subtotal = 0, totalAmount = 0, sharedUnitPrice = 0) {
    const summaryContainer = document.getElementById('summary-items');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotal = document.getElementById('summary-total');
    const summaryDeliveryRow = document.getElementById('summary-delivery-row');
    const summaryDeliveryFee = document.getElementById('summary-delivery-fee');

    if (summaryContainer) {
        // Clear previous list
        summaryContainer.innerHTML = '';

        if (cart.length === 0) {
            const emptyP = document.createElement('p');
            emptyP.textContent = 'Your cart is empty.';
            summaryContainer.appendChild(emptyP);
        } else {
            cart.forEach(item => {
                const lineTotal = getLineTotal(item, sharedUnitPrice);

                const div = document.createElement('div');
                div.className = 'summary-item';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'summary-item-name';
                nameSpan.textContent = item.name;

                const qtySpan = document.createElement('span');
                qtySpan.className = 'summary-item-qty';
                qtySpan.textContent = `×${item.quantity}`;

                const priceSpan = document.createElement('span');
                priceSpan.className = 'summary-item-price';
                priceSpan.textContent = `$${lineTotal.toFixed(2)}`;

                div.appendChild(nameSpan);
                div.appendChild(qtySpan);
                div.appendChild(priceSpan);

                summaryContainer.appendChild(div);
            });
        }
    }

    if (summarySubtotal) summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;

    // Delivery fee summary
    if (summaryDeliveryRow) {
        if (typeof window.deliveryFee === 'number' && window.deliveryFee > 0) {
            summaryDeliveryRow.style.display = 'flex';
            if (summaryDeliveryFee) summaryDeliveryFee.textContent = `$${window.deliveryFee.toFixed(2)}`;
        } else {
            summaryDeliveryRow.style.display = 'none';
        }
    }
    if (summaryTotal) summaryTotal.textContent = `$${totalAmount.toFixed(2)}`;
}

// ================= Quantity Update Functions =================

function updateQuantity(productId, change) {
    const qtyEl = document.getElementById(`${getDomSafeId(productId)}-qty`);
    if (!qtyEl) return;
    
    let qty = parseInt(qtyEl.textContent) || 0;
    qty += change;
    if (qty < 0) qty = 0;
    qtyEl.textContent = qty;
    
    // Reflect updated pricing in button labels
    if (typeof updateDynamicPrices === 'function') {
        updateDynamicPrices();
    }
}

function updateBundleQuantity(productId, change) {
    const qtyEl = document.getElementById(`${getDomSafeId(productId)}-bundle-qty`);
    if (!qtyEl) return;
    
    let qty = parseInt(qtyEl.textContent) || 0;
    qty += change;
    if (qty < 0) qty = 0;
    qtyEl.textContent = qty;
}

// ================= Cart Item Management =================

function adjustCartItem(productId, delta) {
    const item = cart.find(prod => prod.productId === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(prod => prod.productId !== productId);
    }

    saveCart();
    updateCartDisplay();
}

function removeCartItem(productId) {
    cart = cart.filter(prod => prod.productId !== productId);
    saveCart();
    updateCartDisplay();
}

function clearCart() {
    cart = [];
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartDisplay();
}

// ================= Pricing Functions =================

/**
 * Determine price tier for ALL single bottles in cart based on their combined count.
 * Cleanse bundles are excluded from the count and always keep their stored price.
 */
function getCartUnitPrice(totalSingleBottles) {
    if (typeof getTieredPricePerBottle === 'function') {
        return getTieredPricePerBottle(totalSingleBottles);
    }
    // Fallback inline logic (mirror pricing.js)
    if (totalSingleBottles >= 12) return 7.50;
    if (totalSingleBottles >= 6) return 7.75;
    return 7.99;
}

/**
 * Compute the line total for an item, using shared tiered pricing for single bottles
 */
function getLineTotal(item, sharedUnitPrice) {
    const unitPrice = item.isCleanse ? item.price : sharedUnitPrice;
    return unitPrice * item.quantity;
}

// ================= Cleanse Bundle Functions =================

/**
 * Add a cleanse package (multiple bottles sold as a bundle) to the cart.
 * @param {string} cleanseId      Identifier such as '1-day', '3-day', etc.
 * @param {string} name           Display name (e.g., '1-Day Cleanse').
 * @param {number} bottleCount    Number of bottles included in the cleanse.
 * @param {number} bundlePrice    Total bundle price (before any delivery fee).
 */
function addCleanseToCart(cleanseId, name, bottleCount, bundlePrice) {
    if (!bottleCount || bottleCount <= 0) {
        showNotification("Invalid bottle count for cleanse.", "error");
        return;
    }

    const unitPrice = bundlePrice / bottleCount;

    const existingItem = cart.find(item => item.productId === cleanseId && item.isCleanse);
    if (existingItem) {
        existingItem.quantity += bottleCount;
    } else {
        cart.push({
            productId: cleanseId,
            name,
            price: unitPrice,
            quantity: bottleCount,
            isCleanse: true
        });
    }

    saveCart();
    updateCartDisplay();
    showNotification(`${name} added to cart!`, "success");
}

/**
 * Reads the selected flavor for a given cleanse card, then adds that bundle.
 * This is used by the Add Cleanse buttons that allow a flavor dropdown.
 */
function addSelectedCleanseToCart(cleanseId, cleanseName, bottleCount, bundlePrice) {
    // Try to read selected flavor from flavor-option buttons first
    let flavor = 'refresher';
    const activeOption = document.querySelector(`.flavor-option.active[data-cleanse="${cleanseId}"]`);
    if (activeOption) {
        flavor = activeOption.dataset.flavor;
    } else {
        // Fallback to <select> dropdown if still present
        const selectEl = document.getElementById(`${cleanseId}-flavor-select`);
        if (selectEl) {
            flavor = selectEl.value;
        }
    }

    const productId = `${cleanseId}-${flavor}`; // unique SKU
    const flavorLabel = flavor.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const displayName = `${cleanseName} – ${flavorLabel}`;

    addCleanseToCart(productId, displayName, bottleCount, bundlePrice);
}

// ================= Flavor Option Initialization =================

function initFlavorOptionButtons() {
    // Handle existing card-based flavor-option tiles
    document.querySelectorAll('.flavor-options').forEach(group => {
        const options = Array.from(group.querySelectorAll('.flavor-option'));
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                options.forEach(o => o.classList.toggle('active', o === opt));
            });
        });
    });

    // Handle generic flavor-btn buttons (if present elsewhere)
    document.querySelectorAll('#flavor-buttons').forEach(container => {
        const btns = Array.from(container.querySelectorAll('.flavor-btn'));
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.toggle('selected', b === btn));
            });
        });
    });
}

// ================= Event Listeners =================

// Clear cart button
const clearCartBtn = document.getElementById('clear-cart');
if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearCart);
}

// ================= Global Exports =================

// Expose only what is needed by inline handlers or other modules
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.updateBundleQuantity = updateBundleQuantity;
window.updateCartDisplay = updateCartDisplay;
window.addSelectedCleanseToCart = addSelectedCleanseToCart;
window.addCleanseToCart = addCleanseToCart;
window.clearCart = clearCart;

// ================= Single Initialization =================

document.addEventListener('DOMContentLoaded', () => {
    // Ensure cart array reflects persisted data
    cart = loadCart();
    updateCartDisplay();
    initFlavorOptionButtons();
});