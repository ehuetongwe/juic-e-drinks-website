// delivery.js - Consolidated Version
// Enhanced delivery system with proper state management and error handling

// ================= Configuration =================

const STORE_COORDS = { lat: 33.7836, lng: -84.0979 }; // Juic'E Drinks HQ (Stone Mountain, GA)

const deliveryTiers = [
    { maxMiles: 35, fee: 7 }    // Flat $7 fee within 35-mile radius
];

// ================= State Management =================

const deliveryState = {
    validated: false,
    fee: 0,
    distance: 0,
    address: '',
    error: null
};

// ================= Main Functions =================

/**
 * Check delivery availability for the entered address
 * Enhanced with proper error handling and state management
 */
async function checkDeliveryAvailability() {
    if (window.location.hostname === 'localhost') {
        // Mock successful delivery for testing
        const { address, city, zip } = readAddressInputs();
        const addressInfo = `${address}, ${city}, ${zip}`;
        
        deliveryState.validated = true;
        deliveryState.fee = 7;
        deliveryState.distance = 10;
        deliveryState.address = addressInfo;
        
        window.deliveryFee = 7;
        window.deliveryValidated = true;
        updateDeliveryResults(10, 7);
        showNotification('Delivery available! Fee: $7', 'success');
        if (typeof window.updateCartDisplay === 'function') {
            window.updateCartDisplay();
        }
        return deliveryState;
    }

    try {
        // Clear previous state
        deliveryState.error = null;
        
        const { address, city, zip } = readAddressInputs();
        validateAddressInputs(address, city, zip);

        const fullAddress = `${address}, ${city}, ${zip}`;
        const coords = await geocodeAddress(fullAddress);
        const distanceMi = await calculateDrivingDistance(coords);

        const fee = calculateDeliveryFee(distanceMi);
        if (fee === null) {
            throw new Error("Sorry, we don't deliver to your area.");
        }

        // Update state
        deliveryState.validated = true;
        deliveryState.fee = fee;
        deliveryState.distance = distanceMi;
        deliveryState.address = fullAddress;
        
        // Update global variables for compatibility
        window.deliveryValidated = true;
        window.deliveryFee = fee;

        showNotification(`Delivery available! Fee: ${fee === 0 ? 'Free' : `$${fee}`}`, 'success');
        updateDeliveryResults(distanceMi, fee);
        
        // Update cart display to reflect new delivery fee
        if (typeof window.updateCartDisplay === 'function') {
            window.updateCartDisplay();
        }
        
    } catch (err) {
        // Update state with error
        deliveryState.validated = false;
        deliveryState.fee = 0;
        deliveryState.distance = 0;
        deliveryState.address = '';
        deliveryState.error = err.message;
        
        // Update global variables
        window.deliveryValidated = false;
        window.deliveryFee = 0;

        showNotification(`Delivery validation failed: ${err.message}`, 'error');
        clearDeliveryResults();
        
        // Update cart display to reflect no delivery fee
        if (typeof window.updateCartDisplay === 'function') {
            window.updateCartDisplay();
        }
    }
}

/**
 * Calculate delivery fee based on distance
 * Fixed to not overwrite validated fees
 */
function calculateDeliveryFee(distanceMi) {
    const tier = deliveryTiers.find(t => distanceMi <= t.maxMiles);
    return tier ? tier.fee : null;
}

// ================= Input Handling =================

function readAddressInputs() {
    return {
        address: document.getElementById('checkout-address')?.value.trim() || '',
        city: document.getElementById('checkout-city')?.value.trim() || '',
        zip: document.getElementById('checkout-zip')?.value.trim() || ''
    };
}

function validateAddressInputs(addr, city, zip) {
    if (!addr || !city || !zip) {
        throw new Error('Please complete all address fields.');
    }
    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
        throw new Error('Invalid ZIP code format.');
    }
}

// ================= Geocoding and Distance Calculation =================

/**
 * Geocode address using Google Maps API
 * Enhanced with proper error handling
 */
function geocodeAddress(address) {
    return new Promise((resolve, reject) => {
        if (!window.google || !google.maps) {
            reject(new Error('Google Maps not loaded. Please refresh the page.'));
            return;
        }

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const loc = results[0].geometry.location;
                resolve({ lat: loc.lat(), lng: loc.lng() });
            } else {
                reject(new Error('Unable to find that address. Please check your input.'));
            }
        });
    });
}

/**
 * Calculate driving distance with fallback to straight-line distance
 * Enhanced error handling
 */
function calculateDrivingDistance(destCoords) {
    return new Promise((resolve, reject) => {
        if (window.google && google.maps && google.maps.DistanceMatrixService) {
            const svc = new google.maps.DistanceMatrixService();
            svc.getDistanceMatrix({
                origins: [STORE_COORDS],
                destinations: [destCoords],
                travelMode: 'DRIVING',
                unitSystem: google.maps.UnitSystem.IMPERIAL
            }, (res, status) => {
                if (status === 'OK' && res.rows[0].elements[0].status === 'OK') {
                    const meters = res.rows[0].elements[0].distance.value;
                    resolve(meters / 1609.344); // meters → miles
                } else {
                    // Fallback to straight-line distance
                    try {
                        resolve(haversineMiles(STORE_COORDS, destCoords));
                    } catch (err) {
                        reject(new Error('Unable to calculate distance.'));
                    }
                }
            });
        } else {
            try {
                resolve(haversineMiles(STORE_COORDS, destCoords));
            } catch (err) {
                reject(new Error('Unable to calculate distance.'));
            }
        }
    });
}

/**
 * Calculate straight-line distance using Haversine formula
 */
function haversineMiles(a, b) {
    const toRad = deg => deg * Math.PI / 180;
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

// ================= UI Updates =================

function showNotification(msg, type) {
    alert(`${type.toUpperCase()}: ${msg}`);
}

function updateDeliveryResults(distance, fee) {
    const distanceEl = document.getElementById('distance-result');
    const feeEl = document.getElementById('fee-result');
    const availabilityEl = document.getElementById('availability-result');
    const resultEl = document.getElementById('delivery-result');

    if (distanceEl) distanceEl.textContent = `${distance.toFixed(1)} miles`;
    if (feeEl) feeEl.textContent = fee === 0 ? 'Free' : `$${fee}`;
    if (availabilityEl) availabilityEl.textContent = 'Delivery Available';
    if (resultEl) resultEl.style.display = 'block';
}

function clearDeliveryResults() {
    const resultEl = document.getElementById('delivery-result');
    if (resultEl) resultEl.style.display = 'none';
}

// ================= Auto-Validation =================

/**
 * Initialize auto-validation on field blur events
 */
function initDeliveryAutoValidation() {
    const addressFields = [
        'checkout-address',
        'checkout-city', 
        'checkout-zip'
    ];

    addressFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', () => {
                // Only auto-validate if all fields have content
                const { address, city, zip } = readAddressInputs();
                if (address && city && zip) {
                    checkDeliveryAvailability();
                }
            });
        }
    });
}

// ================= State Getters =================

/**
 * Get current delivery state
 */
function getDeliveryState() {
    return { ...deliveryState };
}

/**
 * Check if delivery is currently validated
 */
function isDeliveryValidated() {
    return deliveryState.validated;
}

/**
 * Get current delivery fee
 */
function getDeliveryFee() {
    return deliveryState.fee;
}

// ================= Initialization =================

document.addEventListener('DOMContentLoaded', () => {
    initDeliveryAutoValidation();
    const btn = document.getElementById("validate-delivery-btn");
    if (btn) {
        btn.addEventListener("click", checkDeliveryAvailability);
    }
});

// ================= Global Exports =================

window.checkDeliveryAvailability = checkDeliveryAvailability;
window.calculateDeliveryFee = calculateDeliveryFee;
window.getDeliveryState = getDeliveryState;
window.isDeliveryValidated = isDeliveryValidated;
window.getDeliveryFee = getDeliveryFee;

// Legacy compatibility
window.deliveryValidated = false;
window.deliveryFee = 0;

window.ensureDeliveryValidated = function() {
    if (!window.deliveryValidated) {
        alert("Please validate your delivery address first.");
        return false;
    }
    return true;
}