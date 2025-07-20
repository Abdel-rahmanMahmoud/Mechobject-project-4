// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Check authentication status
function checkAuthStatus() {
    // Check if user is logged in (either regular or Firebase)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const authNav = document.getElementById('authNav');
    const userNav = document.getElementById('userNav');
    const adminNav = document.getElementById('adminNav');
    
    if (user.id) {
        // User is logged in
        authNav.classList.add('d-none');
        userNav.classList.remove('d-none');
        
        // Show admin dashboard link if user is admin
        if (user.role === 'ADMIN') {
            adminNav.classList.remove('d-none');
        }
    } else {
        // User is not logged in
        authNav.classList.remove('d-none');
        userNav.classList.add('d-none');
    }
}

// Show message function
function showMessage(message, type = 'danger') {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} mt-3`;
    alertDiv.textContent = message;
    
    const form = document.getElementById('contactForm');
    form.parentNode.insertBefore(alertDiv, form.nextSibling);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Handle contact form submission
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ name, email, subject, message })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Message sent successfully! We will get back to you soon.', 'success');
            document.getElementById('contactForm').reset();
        } else {
            showMessage(data.message || 'Failed to send message. Please try again.');
        }
    } catch (error) {
        showMessage('Network error. Please try again.');
    }
});

// Setup logout
function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function(e) {
      e.preventDefault();

      try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        } else {
          localStorage.removeItem("user");
          window.location.href = "./index.html";
        }
      } catch (error) {
        console.error("Logout failed:", error);
        alert("Logout failed: " + error);
      }
    });
  }
}


// Initialize page
checkAuthStatus();
setupLogout();