// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Global variables
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

// Load cart items from database
async function loadCartItems() {
  if (!checkAuth()) return;
  
  const cartItemsContainer = document.getElementById('cartItems');
  const cartSummary = document.getElementById('cartSummary');
  
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, getFetchOptions());
    
    if (response.ok) {
      const data = await response.json();
      cart = data.data.cartItems;
      
      if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
          <div class="col-12">
            <div class="empty-cart">
              <h3>Your cart is empty</h3>
              <p>Add some products to get started!</p>
              <a href="./products.html" class="btn btn-primary">Browse Products</a>
            </div>
          </div>
        `;
        cartSummary.innerHTML = '';
        return;
      }
      
      displayCartItems(cart);
    } else {
      cartItemsContainer.innerHTML = '<div class="col-12 text-center">Error loading cart items</div>';
    }
  } catch (error) {
    cartItemsContainer.innerHTML = '<div class="col-12 text-center">Network error</div>';
  }
}

// Display cart items
function displayCartItems(cartItems) {
  const cartItemsContainer = document.getElementById('cartItems');
  const cartSummary = document.getElementById('cartSummary');
  
  let cartHTML = '';
  let totalAmount = 0;
  
  cartItems.forEach(cartItem => {
    const product = cartItem.product;
    const itemTotal = parseFloat(product.price) * cartItem.quantity;
    totalAmount += itemTotal;
    
    cartHTML += `
      <div class="col-12">
        <div class="cart-item">
          <div class="row align-items-center">
            <div class="col-md-2">
              <img src="${product.image ? `http://localhost:8000/uploads/products/${product.image}` : 'https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg'}" 
                   alt="${product.name}" class="cart-item-image">
            </div>
            <div class="col-md-4">
              <div class="cart-item-info">
                <h5>${product.name}</h5>
                <p class="text-muted">${product.category}</p>
              </div>
            </div>
            <div class="col-md-2">
              <div class="cart-item-price">$${product.price}</div>
            </div>
            <div class="col-md-3">
              <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity(${product.id}, ${cartItem.quantity - 1})" ${cartItem.quantity <= 1 ? 'disabled' : ''}>-</button>
                <span class="quantity-display">${cartItem.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${product.id}, ${cartItem.quantity + 1})">+</button>
              </div>
            </div>
            <div class="col-md-1">
              <button class="btn btn-danger btn-sm" onclick="removeFromCart(${product.id})">Remove</button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  cartItemsContainer.innerHTML = cartHTML;
  
  // Display cart summary
  cartSummary.innerHTML = `
    <h4>Order Summary</h4>
    <div class="summary-row">
      <span>Subtotal:</span>
      <span>$${totalAmount.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span>Shipping:</span>
      <span>Free</span>
    </div>
    <div class="total-row">
      <span>Total:</span>
      <span>$${totalAmount.toFixed(2)}</span>
    </div>
    <div class="mt-3">
      <button class="btn btn-success w-100" onclick="proceedToCheckout()">Proceed to Checkout</button>
    </div>
  `;
}

// Update quantity
async function updateQuantity(productId, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/cart/${productId}`, getFetchOptions({
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity: newQuantity })
    }));
    
    if (response.ok) {
      loadCartItems(); // Reload to update display
    } else {
      alert('Failed to update quantity');
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
      loadCartItems(); // Reload to update display
    } else {
      alert('Failed to remove item');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

// Proceed to checkout
function proceedToCheckout() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  window.location.href = './payment.html';
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
loadCartItems();