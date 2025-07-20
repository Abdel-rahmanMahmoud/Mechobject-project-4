// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Show message function
function showMessage(message, type = 'danger') {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} mt-3`;
    alertDiv.textContent = message;
    
    const form = document.getElementById('forgotPasswordForm');
    form.parentNode.insertBefore(alertDiv, form.nextSibling);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Handle forgot password form submission
document.getElementById('forgotPasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Disable button during request
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Password reset link sent to your email! Please check your inbox.', 'success');
            document.getElementById('forgotPasswordForm').reset();
        } else {
            showMessage(data.message || 'Failed to send reset link. Please try again.');
        }
    } catch (error) {
        showMessage('Network error. Please try again.');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Reset Link';
    }
});

// Check if already logged in
const user = localStorage.getItem('user');
if (user) {
    window.location.href = './products.html';
}