// API Configuration
const API_BASE_URL = "http://localhost:8000/api";

// Global variables
let favorites = [];
let cart = [];

// Check authentication
function checkAuth() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.id ? true : false;
}

// Get fetch options based on auth type
function getFetchOptions(additionalOptions = {}) {
  const baseOptions = {
    credentials: "include", // Always include cookies
    ...additionalOptions,
  };

  return baseOptions;
}

// Load cart items to check what's in cart
async function loadCart() {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, getFetchOptions());
    if (response.ok) {
      const data = await response.json();
      cart = data.data.cartItems.map((item) => item.productId);
    }
  } catch (error) {
    console.log("Error loading cart");
  }
}

// Load favorite products from database
async function loadFavorites() {

  const favoritesGrid = document.getElementById("favoritesGrid");

  try {
    // Load cart first to check what's in cart
    await loadCart();

    const response = await fetch(
      `${API_BASE_URL}/favorites`,
      getFetchOptions()
    );

    if (response.ok) {
      const data = await response.json();
      favorites = data.data.favorites;

      if (favorites.length === 0) {
        favoritesGrid.innerHTML = `
          <div class="col-12">
            <div class="no-products">
              <h3>No favorites yet</h3>
              <p>Start adding products to your favorites!</p>
              <a href="./products.html" class="btn btn-primary">Browse Products</a>
            </div>
          </div>
        `;
        return;
      }

      displayFavorites(favorites);
    } else {
      favoritesGrid.innerHTML =
        '<div class="col-12 text-center">Error loading favorites</div>';
    }
  } catch (error) {
    favoritesGrid.innerHTML =
      '<div class="col-12 text-center">Network error</div>';
  }
}

// Display favorites
function displayFavorites(favoriteItems) {
  const favoritesGrid = document.getElementById("favoritesGrid");

  const favoritesHTML = favoriteItems
    .map((favorite) => {
      const product = favorite.product;
      const inCart = cart.includes(product.id);

      return `
      <div class="col-md-6 mb-4">
        <div class="product-card">
          <img src="${
            product.image
              ? `http://localhost:8000/uploads/products/${product.image}`
              : "https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=1024x1024&w=is&k=20&c=Bs1RdueQnaAcO888WBIQsC6NvA7aVTzeRVzSd8sJfUg="
          }" 
               alt="${product.name}" class="product-image">
          <div class="product-info">
            <h5 class="product-name">${product.name}</h5>
            <p class="product-description">${product.description}</p>
            <p class="product-price">$${product.price}</p>
            <div class="product-actions">
              <button class="btn btn-info btn-sm" onclick="viewProduct(${
                product.id
              })">View</button>
              ${
                !inCart
                  ? `<button class="btn btn-success btn-sm" onclick="addToCart(${product.id})">Add to Cart</button>`
                  : `<button class="btn btn-danger btn-sm" onclick="removeFromCart(${product.id})">Remove from Cart</button>`
              }
              <button class="btn btn-danger btn-sm" onclick="removeFromFavorites(${
                product.id
              })">Remove from Favorites</button>
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  favoritesGrid.innerHTML = favoritesHTML;
}

// View product details
function viewProduct(productId) {
  window.location.href = `./product-details.html?id=${productId}`;
}

// Add to cart
async function addToCart(productId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/cart`,
      getFetchOptions({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      })
    );

    if (response.ok) {
      cart.push(productId);
      loadFavorites(); // Refresh to update buttons
    } else {
      alert("Failed to add to cart");
    }
  } catch (error) {
    alert("Network error. Please try again.");
  }
}

// Remove from cart
async function removeFromCart(productId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/cart/${productId}`,
      getFetchOptions({
        method: "DELETE",
      })
    );

    if (response.ok) {
      cart = cart.filter((id) => id !== productId);
      loadFavorites(); // Refresh to update buttons
    } else {
      alert("Failed to remove from cart");
    }
  } catch (error) {
    alert("Network error. Please try again.");
  }
}

// Remove from favorites
async function removeFromFavorites(productId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/favorites/${productId}`,
      getFetchOptions({
        method: "DELETE",
      })
    );

    if (response.ok) {
      loadFavorites(); // Reload to update display
    } else {
      alert("Failed to remove from favorites");
    }
  } catch (error) {
    alert("Network error. Please try again.");
  }
}

// Setup logout

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function (e) {
      e.preventDefault();

      try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
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

if (checkAuth()) {
  setupLogout();
  loadFavorites();
} else {
  window.location.href = "./login.html";
}
