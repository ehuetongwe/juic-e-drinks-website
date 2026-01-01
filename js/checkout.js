// checkout.js - Revised Version

function processOrder() {
    const name = document.getElementById('checkout-name').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const email = document.getElementById('checkout-email').value.trim();
    const address = document.getElementById('checkout-address').value.trim();

    const { totalBottles } = calculateTotals();

    // Validate required fields
    if (!validateFields(name, phone, email, address)) {
        showNotification("Please fill in all required fields correctly.", "error");
        return;
    }

    // Check minimum bottle requirement
    if (totalBottles < 4) {
        showNotification("Minimum order is 4 bottles. Please add more to your cart.", "error");
        return;
    }

    // Simulate order submission
    const orderData = {
        customer: { name, phone, email, address },
        items: [...cart],
        deliveryFee,
        totalBottles,
        subtotal: calculateTotals().subtotal,
        orderTotal: calculateTotals().subtotal + deliveryFee,
        shipping: {
            method: document.getElementById('shipping-method')?.value || 'standard',
            notes: document.getElementById('shipping-notes')?.value?.trim() || ''
        },
        orderDate: new Date().toISOString()
    };

    console.log("Order submitted:", orderData);

    showNotification("Order submitted successfully! We'll contact you shortly.", "success");

    // Reset cart and form
    clearCart();
    clearCheckoutForm();
    updateCartDisplay();
}

// Helper: Validate all required fields
function validateFields(name, phone, email, address) {
    const phonePattern = /^\d{10}$/;  // 10-digit US phone number
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !phone || !email || !address) return false;
    if (!phonePattern.test(phone)) return false;
    if (!emailPattern.test(email)) return false;

    return true;
}

// Helper: Clear checkout form fields
function clearCheckoutForm() {
    document.getElementById('checkout-name').value = "";
    document.getElementById('checkout-phone').value = "";
    document.getElementById('checkout-email').value = "";
    document.getElementById('checkout-address').value = "";
    const shippingSelect = document.getElementById('shipping-method');
    if (shippingSelect) {
        shippingSelect.value = 'standard';
        if (typeof window.applyShippingMethod === 'function') {
            window.applyShippingMethod('standard');
        }
    }
    const shippingNotes = document.getElementById('shipping-notes');
    if (shippingNotes) shippingNotes.value = "";
}

// Helper: Reset cart
function clearCart() {
    cart = [];
    saveCart();
}

// Expose globally for main.js event handler
window.processOrder = processOrder; 