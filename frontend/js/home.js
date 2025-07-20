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

// Logout functionality
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