// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Global variables
let currentProduct = null;
let quantity = 1;
let favorites = [];
let cart = [];

// Check authentication
function checkAuth() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) {
    window.location.href = './login.html';
    return false;
  }
  return true;
}

// Get fetch options based on auth type
function getFetchOptions(additionalOptions = {}) {
  const baseOptions = {
    credentials: 'include', // Always include cookies
    ...additionalOptions
  };
  
  return baseOptions;
}

// Get product ID from URL
function getProductId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

// Load favorites and cart
async function loadUserData() {
  try {
    // Load favorites
    const favResponse = await fetch(`${API_BASE_URL}/favorites`, getFetchOptions());
    if (favResponse.ok) {
      const favData = await favResponse.json();
      favorites = favData.data.favorites.map(fav => fav.productId);
    }

    // Load cart
    const cartResponse = await fetch(`${API_BASE_URL}/cart`, getFetchOptions());
    if (cartResponse.ok) {
      const cartData = await cartResponse.json();
      cart = cartData.data.cartItems.map(item => item.productId);
    }
  } catch (error) {
    console.log('Error loading user data');
  }
}

// Load product details
async function loadProductDetails() {
  if (!checkAuth()) return;
  
  const productId = getProductId();
  if (!productId) {
    window.location.href = './products.html';
    return;
  }
  
  const container = document.getElementById('productDetails');
  
  try {
    container.innerHTML = '<div class="loading"><h3>Loading product details...</h3></div>';
    
    // Load user data first
    await loadUserData();
    
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
    
    if (response.ok) {
      const data = await response.json();
      currentProduct = data.data.product;
      displayProduct(currentProduct);
    } else {
      container.innerHTML = '<div class="error"><h3>Product not found</h3></div>';
    }
  } catch (error) {
    container.innerHTML = '<div class="error"><h3>Error loading product</h3></div>';
  }
}

// Display product details
function displayProduct(product) {
  const container = document.getElementById('productDetails');
  const isFavorite = favorites.includes(product.id);
  const inCart = cart.includes(product.id);
  const isOutOfStock = product.stock <= 0;
  
  container.innerHTML = `
    <div class="product-details-card">
      <div class="row">
        <div class="col-lg-6">
          <img src="${product.image ? `http://localhost:8000/uploads/products/${product.image}` : 'https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg'}" 
               alt="${product.name}" class="product-image">
        </div>
        <div class="col-lg-6">
          <h1 class="product-title">${product.name}</h1>
          <div class="product-category">${product.category}</div>
          <div class="product-price">$${product.price}</div>
          <div class="product-stock ${isOutOfStock ? 'out-of-stock' : ''}">
            ${isOutOfStock ? 'Out of Stock' : `${product.stock} items in stock`}
          </div>
          <p class="product-description">${product.description}</p>
          
          ${!isOutOfStock ? `
            <div class="quantity-selector">
              <label>Quantity:</label>
              <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity(-1)" ${quantity <= 1 ? 'disabled' : ''}>-</button>
                <input type="number" class="quantity-input" id="quantityInput" value="${quantity}" min="1" max="${product.stock}" onchange="setQuantity(this.value)">
                <button class="quantity-btn" onclick="updateQuantity(1)" ${quantity >= product.stock ? 'disabled' : ''}>+</button>
              </div>
            </div>
          ` : ''}
          
          <div class="product-actions">
            ${!isOutOfStock && !inCart ? `
              <button class="btn btn-success" onclick="addToCart()">Add to Cart</button>
            ` : ''}
            ${inCart ? `
              <button class="btn btn-danger" onclick="removeFromCart()">Remove from Cart</button>
            ` : ''}
            ${isOutOfStock ? `
              <button class="btn btn-secondary" disabled>Out of Stock</button>
            ` : ''}
            <button class="btn btn-outline-${isFavorite ? 'danger' : 'primary'}" onclick="toggleFavorite()">
              ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Update quantity
function updateQuantity(change) {
  const newQuantity = quantity + change;
  if (newQuantity >= 1 && newQuantity <= currentProduct.stock) {
    quantity = newQuantity;
    displayProduct(currentProduct); // Refresh display
  }
}

// Set quantity directly
function setQuantity(value) {
  const newQuantity = parseInt(value);
  if (newQuantity >= 1 && newQuantity <= currentProduct.stock) {
    quantity = newQuantity;
  } else {
    document.getElementById('quantityInput').value = quantity;
  }
}

// Add to cart
async function addToCart() {
  if (!currentProduct) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, getFetchOptions({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId: currentProduct.id, quantity: quantity })
    }));
    
    if (response.ok) {
      cart.push(currentProduct.id);
      displayProduct(currentProduct); // Refresh display
      alert(`Added ${quantity} ${currentProduct.name}(s) to cart!`);
    } else {
      alert('Failed to add to cart');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

// Remove from cart
async function removeFromCart() {
  if (!currentProduct) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/cart/${currentProduct.id}`, getFetchOptions({
      method: 'DELETE'
    }));
    
    if (response.ok) {
      cart = cart.filter(id => id !== currentProduct.id);
      displayProduct(currentProduct); // Refresh display
      alert('Removed from cart!');
    } else {
      alert('Failed to remove from cart');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

// Toggle favorite
async function toggleFavorite() {
  if (!currentProduct) return;
  
  const isFavorite = favorites.includes(currentProduct.id);
  
  try {
    if (isFavorite) {
      const response = await fetch(`${API_BASE_URL}/favorites/${currentProduct.id}`, getFetchOptions({
        method: 'DELETE'
      }));
      
      if (response.ok) {
        favorites = favorites.filter(id => id !== currentProduct.id);
        displayProduct(currentProduct); // Refresh display
      }
    } else {
      const response = await fetch(`${API_BASE_URL}/favorites`, getFetchOptions({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId: currentProduct.id })
      }));
      
      if (response.ok) {
        favorites.push(currentProduct.id);
        displayProduct(currentProduct); // Refresh display
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
setupLogout();
loadProductDetails();