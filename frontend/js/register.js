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
    
    const form = document.getElementById('registerForm');
    form.parentNode.insertBefore(alertDiv, form.nextSibling);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Handle regular registration (HTTP-Only cookies)
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Check if passwords match
    if (password !== confirmPassword) {
        showMessage('Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data.data.user));
            showMessage('Registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = './products.html';
            }, 1000);
        } else {
            showMessage(data.message || 'Registration failed');
        }
    } catch (error) {
        showMessage('Network error. Please try again.');
    }
});

// Handle Google Sign Up (Firebase ID Token)
document.getElementById('googleSignUp').addEventListener('click', async function() {
    try {
        const provider = new window.GoogleAuthProvider();
        const result = await window.signInWithPopup(window.firebaseAuth, provider);
        const user = result.user;
        
        // Get Firebase ID token
        const idToken = await user.getIdToken();
        
        const userData = {
            id: user.uid,
            firstName: user.displayName?.split(' ')[0] || 'User',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || 'Name',
            email: user.email,
            role: 'USER',
            avatar: user.photoURL || 'profile.png'
        };
        
        // Send ID token to backend
        const response = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ idToken, userData })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('user', JSON.stringify(data.data.user));
            showMessage('Google registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = './products.html';
            }, 1000);
        } else {
            showMessage('Registration failed. Please try again.');
        }
    } catch (error) {
        showMessage('Google registration failed. Please try again.');
    }
});

// Handle Facebook Sign Up (Firebase ID Token)
document.getElementById('facebookSignUp').addEventListener('click', async function() {
    try {
        const provider = new window.FacebookAuthProvider();
        const result = await window.signInWithPopup(window.firebaseAuth, provider);
        const user = result.user;
        
        // Get Firebase ID token
        const idToken = await user.getIdToken();
        
        const userData = {
            id: user.uid,
            firstName: user.displayName?.split(' ')[0] || 'User',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || 'Name',
            email: user.email,
            role: 'USER',
            avatar: user.photoURL || 'profile.png'
        };
        
        // Send ID token to backend
        const response = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ idToken, userData })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('user', JSON.stringify(data.data.user));
            showMessage('Facebook registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = './products.html';
            }, 1000);
        } else {
            showMessage('Registration failed. Please try again.');
        }
    } catch (error) {
        showMessage('Facebook registration failed. Please try again.');
    }
});

// Check if already logged in
function checkIfLoggedIn() {
    const user = localStorage.getItem('user');
    if (user) {
        window.location.href = './products.html';
    }
}

checkIfLoggedIn();