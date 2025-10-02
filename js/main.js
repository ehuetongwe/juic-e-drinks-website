// main.js - Consolidated Version
// Unified application initialization and core functionality

// ================= Core Application Initialization =================

/**
 * Single entry point for application initialization
 * Calls all initialization functions in proper sequence
 */
function initializeApp() {
    // Initialize core systems first
    initNotificationSystem();
    initDeliveryDefaults();
    
    // Initialize UI components
    initNav();
    initCartModal();
    initFlavorTabs();
    initCountdownTimer();
    
    // Initialize feature modules
    initDeliveryCheck();
    initBundleBuilder();
    initCheckout();
    
    // Clean up legacy elements
    removeLegacyFlavorDropdowns();
    
    console.log('Juic\'E Drinks app initialized successfully');
}

// ================= Notification System =================

/**
 * Initialize the notification system with proper styling
 * Creates notification container and sets up responsive behavior
 */
function initNotificationSystem() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 16px;
            right: 16px;
            left: auto;
            z-index: 10000;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: flex-end;
        `;

        // Responsive: center on narrow screens
        const mq = window.matchMedia('(max-width: 480px)');
        const applyResponsive = () => {
            if (mq.matches) {
                container.style.right = '0';
                container.style.left = '0';
                container.style.alignItems = 'center';
            } else {
                container.style.right = '16px';
                container.style.left = 'auto';
                container.style.alignItems = 'flex-end';
            }
        };
        applyResponsive();
        mq.addEventListener('change', applyResponsive);

        document.body.appendChild(container);
    }
}

/**
 * Global notification function with proper styling and animations
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 * @param {number} duration - Display duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3500) {
    // Guard: sensible defaults
    const safeMessage = typeof message === 'string' && message.trim() ? message : 'Notification';
    const safeType = ['success', 'error', 'info'].includes(type) ? type : 'info';
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 3500;

    const container = document.getElementById('notification-container') || (() => {
        initNotificationSystem();
        return document.getElementById('notification-container');
    })();
    if (!container) return;

    const notification = document.createElement('div');
    const bgColor = safeType === 'success' ? '#10B981' : safeType === 'error' ? '#EF4444' : '#3B82F6';

    notification.style.cssText = `
        background: ${bgColor};
        color: #fff;
        padding: 12px 16px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.12);
        pointer-events: auto;
        transform: translateY(-20px);
        opacity: 0;
        transition: transform 200ms ease, opacity 200ms ease;
        max-width: 320px;
        width: max-content;
        word-break: break-word;
        font-size: 14px;
        line-height: 1.4;
        cursor: pointer;
    `;
    notification.textContent = safeMessage;

    // Insert at top to stack newest first
    if (container.firstChild) {
        container.insertBefore(notification, container.firstChild);
    } else {
        container.appendChild(notification);
    }

    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    });

    // Auto-dismiss
    const remove = () => {
        notification.style.transform = 'translateY(-10px)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 200);
    };

    const timeoutId = setTimeout(remove, safeDuration);

    // Allow manual dismiss on click
    notification.addEventListener('click', () => {
        clearTimeout(timeoutId);
        remove();
    });
}

// ================= Cart Modal Management =================

/**
 * Initialize cart modal with background click handler
 * Sets up cart icon, modal, and close button interactions
 */
function initCartModal() {
    const cartIcon = document.getElementById('cart-icon');
    const cartModal = document.getElementById('cart-modal');
    const closeCart = document.getElementById('close-cart');

    if (!cartIcon || !cartModal) return;

    // Open cart modal
    cartIcon.addEventListener('click', () => {
        cartModal.classList.add('active');
        if (typeof window.updateCartDisplay === 'function') {
            window.updateCartDisplay();
        }
    });

    // Close cart modal
    if (closeCart) {
        closeCart.addEventListener('click', () => {
            cartModal.classList.remove('active');
        });
    }

    // Background click handler
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.classList.remove('active');
        }
    });

    // Escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartModal.classList.contains('active')) {
            cartModal.classList.remove('active');
        }
    });
}

// ================= Countdown Timer =================

/**
 * Initialize countdown timer for Wednesday 8AM
 * Calculates next Wednesday at 8:00 AM and updates display
 */
function initCountdownTimer() {
    const timerEl = document.getElementById('countdown-timer');
    if (!timerEl) return;

    // Calculate next Wednesday at 8:00 AM local time
    function getNextFastDate() {
        const now = new Date();
        const result = new Date(now);
        result.setHours(8, 0, 0, 0); // 8:00 AM
        const dayOfWeek = result.getDay(); // 0 = Sunday
        const daysUntilWed = (3 - dayOfWeek + 7) % 7; // Wednesday = 3
        if (daysUntilWed === 0 && result <= now) {
            result.setDate(result.getDate() + 7);
        } else {
            result.setDate(result.getDate() + daysUntilWed);
        }
        return result;
    }

    const targetDate = getNextFastDate();
    let intervalId;

    function updateCountdown() {
        const now = new Date();
        const diffMs = targetDate - now;

        if (diffMs <= 0) {
            timerEl.textContent = "We're Live!";
            if (intervalId) clearInterval(intervalId);
            return;
        }

        const seconds = Math.floor(diffMs / 1000) % 60;
        const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
        const hours = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        timerEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    updateCountdown(); // initial paint
    intervalId = setInterval(updateCountdown, 1000);
}

// ================= Navigation =================

/**
 * Initialize navigation menu toggle
 */
function initNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking on links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

// ================= Flavor Tabs =================

/**
 * Initialize flavor profile tabs
 */
function initFlavorTabs() {
    const tabButtons = document.querySelectorAll('.flavor-tabs .tab-btn');
    const tabPanels = document.querySelectorAll('.flavor-tabs .tab-panel');
    if (!tabButtons.length || !tabPanels.length) return;

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');

            // Toggle button active states
            tabButtons.forEach(b => b.classList.toggle('active', b === btn));

            // Toggle panel visibility
            tabPanels.forEach(panel => {
                const isMatch = panel.id === `${target}-panel`;
                panel.classList.toggle('active', isMatch);
            });
        });
    });
}

// ================= Delivery Check =================

/**
 * Initialize delivery check functionality
 */
function initDeliveryCheck() {
    const btn = document.getElementById('check-delivery-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const address = document.getElementById('delivery-address')?.value;
        if (typeof window.checkDeliveryAvailability === 'function') {
            window.checkDeliveryAvailability(address);
        }
    });
}

// ================= Bundle Builder =================

/**
 * Initialize bundle builder functionality
 */
function initBundleBuilder() {
    // Placeholder: Add event listeners for bundle builder modal
    // This can be expanded when bundle builder features are implemented
}

// ================= Checkout =================

/**
 * Initialize checkout functionality
 */
function initCheckout() {
    // Support both the original #checkout-btn (inside cart modal) and any additional
    // .proceed-to-checkout-btn elements the page may include
    const buttons = [
        document.getElementById('checkout-btn'),
        ...document.querySelectorAll('.proceed-to-checkout-btn')
    ].filter(Boolean);

    if (!buttons.length) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            // Close cart modal if it's open
            const cartModal = document.getElementById('cart-modal');
            if (cartModal) cartModal.classList.remove('active');

            // Smooth-scroll to the checkout section if it exists
            const checkoutSection = document.getElementById('checkout');
            if (checkoutSection) {
                checkoutSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                // Fallback: navigate to a dedicated checkout page if provided
                window.location.href = '/checkout.html';
            }
        });
    });
}

// ================= Delivery Defaults =================

/**
 * Initialize default delivery settings
 */
function initDeliveryDefaults() {
    // Set default delivery fee for local delivery
    if (typeof window.deliveryFee === 'undefined') {
        window.deliveryFee = 7; // Default $7 delivery fee
    }
    if (typeof window.deliveryValidated === 'undefined') {
        window.deliveryValidated = false;
    }
}

// ================= Legacy Cleanup =================

/**
 * Remove deprecated flavor dropdowns
 */
function removeLegacyFlavorDropdowns() {
    // Remove any <label> elements tied to legacy flavor dropdowns
    document.querySelectorAll('label.flavor-label').forEach(el => el.remove());
    // Remove the <select> elements themselves
    document.querySelectorAll('select.flavor-select').forEach(el => el.remove());
}

// ================= Global Exports =================

// Make showNotification globally available
window.showNotification = showNotification;

// ================= Application Start =================

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);