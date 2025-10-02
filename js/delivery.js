// notification-helper.js - Simple notification system
// Add this to your main.js or as a separate file

function showNotification(message, type = 'info', duration = 4000) {
    console.log(`📢 Notification [${type}]:`, message);
    
    // Remove any existing notifications first
    const existing = document.getElementById('delivery-notification');
    if (existing) existing.remove();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'delivery-notification';
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        left: 20px;
        max-width: 400px;
        margin: 0 auto;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.5;
        animation: slideIn 0.3s ease-out;
        cursor: pointer;
    `;
    
    // Style based on type
    if (type === 'success') {
        notification.style.background = '#10B981';
        notification.style.color = '#fff';
    } else if (type === 'error') {
        notification.style.background = '#EF4444';
        notification.style.color = '#fff';
    } else {
        notification.style.background = '#3B82F6';
        notification.style.color = '#fff';
    }
    
    notification.textContent = message;
    
    // Add animation keyframes
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateY(-20px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove
    const remove = () => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    };
    
    const timeoutId = setTimeout(remove, duration);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
        clearTimeout(timeoutId);
        remove();
    });
}

// Make globally available
window.showNotification = showNotification;
