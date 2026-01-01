// shipping.js - Nationwide cold-pack shipping configuration

const SHIPPING_METHODS = {
    standard: {
        label: 'Standard Cold-Pack (1–3 business days)',
        fee: 24,
        description: 'Ships Monday–Wednesday via insulated 2-day service with gel packs.'
    },
    express: {
        label: 'Express Overnight (best for cleanses)',
        fee: 42,
        description: 'Ships Monday–Wednesday via overnight air with additional ice packs.'
    }
};

window.shippingState = {
    method: 'standard',
    description: SHIPPING_METHODS.standard.description
};

window.deliveryValidated = true;
window.deliveryFee = SHIPPING_METHODS.standard.fee;

function applyShippingMethod(method) {
    const config = SHIPPING_METHODS[method] || SHIPPING_METHODS.standard;
    window.shippingState.method = method;
    window.shippingState.description = config.description;
    window.deliveryFee = config.fee;

    const cartFee = document.getElementById('delivery-fee-amount');
    if (cartFee) {
        cartFee.textContent = `$${config.fee.toFixed(2)}`;
        const container = document.getElementById('delivery-fee-container');
        if (container) container.style.display = 'flex';
    }

    const summaryFee = document.getElementById('summary-delivery-fee');
    if (summaryFee) summaryFee.textContent = `$${config.fee.toFixed(2)}`;

    const summaryRow = document.getElementById('summary-delivery-row');
    if (summaryRow) summaryRow.style.display = config.fee > 0 ? 'flex' : 'none';

    const helper = document.getElementById('shipping-method-description');
    if (helper) helper.textContent = config.description;

    if (typeof window.updateCartDisplay === 'function') {
        window.updateCartDisplay();
    }
}

function initShippingSelector() {
    const select = document.getElementById('shipping-method');
    if (!select) return;

    select.addEventListener('change', () => applyShippingMethod(select.value));
    applyShippingMethod(select.value || 'standard');
}

function initShippingUI() {
    const container = document.getElementById('delivery-fee-container');
    if (container) container.style.display = 'flex';
    const summaryRow = document.getElementById('summary-delivery-row');
    if (summaryRow) summaryRow.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
    initShippingSelector();
    initShippingUI();
    console.log('📦 Shipping module initialized with nationwide coverage');
});


window.applyShippingMethod = applyShippingMethod;
