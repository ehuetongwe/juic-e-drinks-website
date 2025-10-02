// delivery.js - NO GOOGLE MAPS VERSION
// Works immediately without Google Maps API configuration

const STORE_COORDS = { lat: 33.7836, lng: -84.0979 }; // Stone Mountain, GA

// Global state
window.deliveryValidated = false;
window.deliveryFee = 0;

/**
 * Simple ZIP code based validation (no Google Maps needed)
 */
async function checkDeliveryAvailability() {
    console.log('🚀 Validation started!');
    
    const button = event?.target || document.querySelector('button[onclick*="checkDeliveryAvailability"]');
    const originalText = button ? button.textContent : '';
    
    try {
        // Disable button
        if (button) {
            button.disabled = true;
            button.textContent = 'Validating...';
            button.style.opacity = '0.6';
        }
        
        // Get form values
        const address = document.getElementById('checkout-address')?.value.trim();
        const city = document.getElementById('checkout-city')?.value.trim();
        const zip = document.getElementById('checkout-zip')?.value.trim();
        
        console.log('📝 Form values:', { address, city, zip });
        
        // Validate inputs
        if (!address) {
            throw new Error('Please enter your street address');
        }
        if (!city) {
            throw new Error('Please enter your city');
        }
        if (!zip) {
            throw new Error('Please enter your ZIP code');
        }
        
        if (!/^\d{5}(-\d{4})?$/.test(zip)) {
            throw new Error('Please enter a valid ZIP code (e.g., 30303)');
        }
        
        // Simulate validation delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // ZIP code based validation for Georgia area
        const zipCode = parseInt(zip.substring(0, 5));
        const isInDeliveryArea = validateGeorgiaZipCode(zipCode);
        
        if (!isInDeliveryArea) {
            throw new Error('Sorry, we currently only deliver to the Greater Atlanta area (ZIP codes 30000-31999)');
        }
        
        // Estimate distance based on ZIP code (rough approximation)
        const estimatedDistance = estimateDistanceFromZip(zipCode);
        
        // Success!
        window.deliveryValidated = true;
        window.deliveryFee = 7;
        
        showSuccess(
            `✅ Delivery available!\n\nAddress: ${address}, ${city}, ${zip}\nEstimated distance: ${estimatedDistance} miles\nDelivery fee: $7.00`,
            estimatedDistance,
            7
        );
        
        console.log('✅ Validation successful!');
        console.log('📍 Validated address:', { address, city, zip, estimatedDistance });
        
        return true;
        
    } catch (error) {
        console.error('❌ Validation error:', error);
        
        window.deliveryValidated = false;
        window.deliveryFee = 0;
        
        showError('❌ ' + error.message);
        
        return false;
        
    } finally {
        // Re-enable button
        if (button) {
            button.disabled = false;
            button.textContent = originalText || 'Validate Delivery Address';
            button.style.opacity = '1';
        }
        
        // Update cart display
        if (typeof window.updateCartDisplay === 'function') {
            window.updateCartDisplay();
        }
    }
}

/**
 * Validate Georgia ZIP codes (30000-31999 covers most of Atlanta metro)
 */
function validateGeorgiaZipCode(zipCode) {
    // Greater Atlanta area ZIP codes
    return zipCode >= 30000 && zipCode <= 31999;
}

/**
 * Estimate distance based on ZIP code proximity to Stone Mountain (30083)
 */
function estimateDistanceFromZip(zipCode) {
    const storeZip = 30083; // Stone Mountain
    const zipDiff = Math.abs(zipCode - storeZip);
    
    // Rough estimation: each ZIP code unit ≈ 1-2 miles difference
    let estimatedDistance = 15; // Default middle distance
    
    if (zipDiff <= 10) {
        estimatedDistance = 5 + (zipDiff * 0.5);
    } else if (zipDiff <= 50) {
        estimatedDistance = 10 + (zipDiff * 0.3);
    } else {
        estimatedDistance = 20 + (zipDiff * 0.2);
    }
    
    // Cap at 35 miles (delivery limit)
    return Math.min(Math.round(estimatedDistance * 10) / 10, 35);
}

/**
 * Show success notification and update UI
 */
function showSuccess(message, distance, fee) {
    // Create a nice notification
    createNotification(message, 'success');
    
    // Update delivery results section
    const distanceEl = document.getElementById('distance-result');
    const feeEl = document.getElementById('fee-result');
    const availabilityEl = document.getElementById('availability-result');
    const resultContainer = document.getElementById('delivery-result');
    
    if (distanceEl) distanceEl.textContent = `~${distance} miles`;
    if (feeEl) feeEl.textContent = `$${fee.toFixed(2)}`;
    if (availabilityEl) {
        availabilityEl.textContent = '✅ Delivery Available';
        availabilityEl.style.color = '#10B981';
        availabilityEl.style.fontWeight = '600';
    }
    if (resultContainer) {
        resultContainer.style.display = 'block';
        resultContainer.style.border = '2px solid #10B981';
        resultContainer.style.background = '#f0fdf4';
    }
}

/**
 * Show error notification
 */
function showError(message) {
    createNotification(message, 'error');
    
    // Hide delivery results
    const resultContainer = document.getElementById('delivery-result');
    if (resultContainer) resultContainer.style.display = 'none';
}

/**
 * Create a styled notification popup
 */
function createNotification(message, type) {
    // Remove existing notifications
    const existing = document.querySelectorAll('.delivery-notification');
    existing.forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = 'delivery-notification';
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#10B981' : '#EF4444'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 90%;
        width: 400px;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.5;
        white-space: pre-line;
        text-align: center;
        animation: slideDown 0.3s ease-out;
        cursor: pointer;
    `;
    
    notification.innerHTML = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { opacity: 0; transform: translate(-50%, -20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
    `;
    if (!document.querySelector('style[data-delivery-animations]')) {
        style.setAttribute('data-delivery-animations', 'true');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    const timeout = setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
        clearTimeout(timeout);
        notification.style.animation = 'slideDown 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    });
}

// Make globally available
window.checkDeliveryAvailability = checkDeliveryAvailability;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Delivery validation system loaded (ZIP-based)');
    console.log('📍 Store location: Stone Mountain, GA (ZIP: 30083)');
    console.log('🗺️ Delivery area: Greater Atlanta (ZIP codes 30000-31999)');
});
