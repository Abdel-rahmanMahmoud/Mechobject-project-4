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
    
    const form = document.getElementById('resetPasswordForm');
    form.parentNode.insertBefore(alertDiv, form.nextSibling);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Get token and id from URL
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        token: urlParams.get('token'),
        id: urlParams.get('id')
    };
}

// Handle reset password form submission
document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const { token, id } = getUrlParams();
    
    // Check if passwords match
    if (password !== confirmPassword) {
        showMessage('Passwords do not match');
        return;
    }
    
    // Check if token and id exist
    if (!token || !id) {
        showMessage('Invalid reset link. Please request a new password reset.');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Disable button during request
    submitBtn.disabled = true;
    submitBtn.textContent = 'Resetting...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, id, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Password reset successfully! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = './login.html';
            }, 2000);
        } else {
            showMessage(data.message || 'Failed to reset password. Please try again.');
        }
    } catch (error) {
        showMessage('Network error. Please try again.');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset Password';
    }
});

// Check if already logged in
const user = localStorage.getItem('user');
if (user) {
    window.location.href = './products.html';
}

// Check if valid reset link
const { token, id } = getUrlParams();
if (!token || !id) {
    showMessage('Invalid reset link. Please request a new password reset.', 'warning');
}