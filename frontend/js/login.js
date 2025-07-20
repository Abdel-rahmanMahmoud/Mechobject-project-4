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
    
    const form = document.getElementById('loginForm');
    form.parentNode.insertBefore(alertDiv, form.nextSibling);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Handle regular login (HTTP-Only cookies)
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data.data.user));
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = './products.html';
            }, 1000);
        } else {
            showMessage(data.message || 'Login failed');
        }
    } catch (error) {
        showMessage('Network error. Please try again.');
    }
});

// Handle Google Sign In (Firebase ID Token)
document.getElementById('googleSignIn').addEventListener('click', async function() {
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
            showMessage('Google sign-in successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = './products.html';
            }, 1000);
        } else {
            showMessage('Authentication failed. Please try again.');
        }
    } catch (error) {
        showMessage('Google sign-in failed. Please try again.');
    }
});

// Handle Facebook Sign In (Firebase ID Token)
document.getElementById('facebookSignIn').addEventListener('click', async function() {
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
            showMessage('Facebook sign-in successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = './products.html';
            }, 1000);
        } else {
            showMessage('Authentication failed. Please try again.');
        }
    } catch (error) {
        showMessage('Facebook sign-in failed. Please try again.');
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