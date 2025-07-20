// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Global variables
let currentPage = 1;
let currentCategory = '';
let favorites = [];
let cart = [];

// Check authentication and redirect if not logged in
function checkAuth() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const authType = localStorage.getItem('authType');
  
  if (!user.id) {
    document.getElementById('loginMessage').classList.remove('d-none');
    document.getElementById('productsGrid').innerHTML = '';
    document.getElementById('pagination').innerHTML = '';
    return false;
  }
  
  // Update navbar
  const authNav = document.getElementById('authNav');
  const userNav = document.getElementById('userNav');
  const adminNav = document.getElementById('adminNav');
  
  authNav.classList.add('d-none');
  userNav.classList.remove('d-none');
  
  if (user.role === 'ADMIN') {
    adminNav.classList.remove('d-none');
  }
  
  return { user, authType };
}

// Get fetch options based on auth type
function getFetchOptions(additionalOptions = {}) {
  const baseOptions = {
    credentials: 'include', // Always include cookies
    ...additionalOptions
  };
  
  return baseOptions;
}

// Load favorites from database
async function loadFavorites() {
  try {
    const response = await fetch(`${API_BASE_URL}/favorites`, getFetchOptions());
    if (response.ok) {
      const data = await response.json();
      favorites = data.data.favorites.map(fav => fav.productId);
    }
  } catch (error) {
    console.log('Error loading favorites');
  }
}

// Load cart from database
async function loadCart() {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, getFetchOptions());
    if (response.ok) {
      const data = await response.json();
      cart = data.data.cartItems.map(item => item.productId);
    }
  } catch (error) {
    console.log('Error loading cart');
  }
}

// Load products from API
async function loadProducts(page = 1, category = '') {
  const authCheck = checkAuth();
  if (!authCheck) return;
  
  const productsGrid = document.getElementById('productsGrid');
  
  try {
    productsGrid.innerHTML = '<div class="col-12 loading">Loading products...</div>';
    
    // Load favorites and cart first
    await loadFavorites();
    await loadCart();
    
    let url = `${API_BASE_URL}/products?page=${page}&limit=4`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    
    const response = await fetch(url);
    
    const data = await response.json();
    
    if (response.ok) {
      displayProducts(data.data.products);
      setupPagination(data.data.totalPages, data.data.currentPage);
    } else {
      productsGrid.innerHTML = '<div class="col-12 text-center">Failed to load products</div>';
    }
  } catch (error) {
    productsGrid.innerHTML = '<div class="col-12 text-center">Network error. Please try again.</div>';
  }
}

// Display products in grid
function displayProducts(products) {
  const productsGrid = document.getElementById('productsGrid');
  
  if (products.length === 0) {
    productsGrid.innerHTML = '<div class="col-12 no-products">No products found</div>';
    return;
  }
  
  const productsHTML = products.map(product => {
    const isFavorite = favorites.includes(product.id);
    const inCart = cart.includes(product.id);
    
    return `
      <div class="col-md-6 mb-4">
        <div class="product-card">
          <img src="${product.image ? `http://localhost:8000/uploads/products/${product.image}` : 'https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg'}" 
               alt="${product.name}" class="product-image">
          <div class="product-info">
            <h5 class="product-name">${product.name}</h5>
            <p class="product-description">${product.description}</p>
            <p class="product-price">$${product.price}</p>
            <div class="product-actions">
              <button class="btn btn-info btn-sm" onclick="viewProduct(${product.id})">View</button>
              ${!inCart ? 
                `<button class="btn btn-success btn-sm" onclick="addToCart(${product.id})">Add to Cart</button>` :
                `<button class="btn btn-danger btn-sm" onclick="removeFromCart(${product.id})">Remove from Cart</button>`
              }
              <button class="btn btn-${isFavorite ? 'danger' : 'primary'} btn-sm" onclick="toggleFavorite(${product.id})">
                ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  productsGrid.innerHTML = productsHTML;
}

// Setup pagination
function setupPagination(totalPages, currentPageNum) {
  const pagination = document.getElementById('pagination');
  currentPage = currentPageNum;
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let paginationHTML = '';
  
  // Previous button
  if (currentPage > 1) {
    paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadProducts(${currentPage - 1}, '${currentCategory}')">Previous</a></li>`;
  }
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    paginationHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}">
      <a class="page-link" href="#" onclick="loadProducts(${i}, '${currentCategory}')">${i}</a></li>`;
  }
  
  // Next button
  if (currentPage < totalPages) {
    paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadProducts(${currentPage + 1}, '${currentCategory}')">Next</a></li>`;
  }
  
  pagination.innerHTML = paginationHTML;
}

// Filter products by category
function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Get category and load products
      currentCategory = this.getAttribute('data-category');
      currentPage = 1;
      loadProducts(1, currentCategory);
    });
  });
}

// View product details
function viewProduct(productId) {
  window.location.href = `./product-details.html?id=${productId}`;
}

// Add to cart
async function addToCart(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, getFetchOptions({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId, quantity: 1 })
    }));
    
    if (response.ok) {
      cart.push(productId);
      loadProducts(currentPage, currentCategory); // Refresh to update buttons
    } else {
      alert('Failed to add to cart');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

// Remove from cart
async function removeFromCart(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/${productId}`, getFetchOptions({
      method: 'DELETE'
    }));
    
    if (response.ok) {
      cart = cart.filter(id => id !== productId);
      loadProducts(currentPage, currentCategory); // Refresh to update buttons
    } else {
      alert('Failed to remove from cart');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

// Toggle favorite
async function toggleFavorite(productId) {
  const isFavorite = favorites.includes(productId);
  
  try {
    if (isFavorite) {
      // Remove from favorites
      const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, getFetchOptions({
        method: 'DELETE'
      }));
      
      if (response.ok) {
        favorites = favorites.filter(id => id !== productId);
        loadProducts(currentPage, currentCategory); // Refresh to update buttons
      }
    } else {
      // Add to favorites
      const response = await fetch(`${API_BASE_URL}/favorites`, getFetchOptions({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      }));
      
      if (response.ok) {
        favorites.push(productId);
        loadProducts(currentPage, currentCategory); // Refresh to update buttons
      }
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

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
setupFilters();
setupLogout();
loadProducts();