// API Configuration
const API_BASE_URL = "http://localhost:8000/api";

// Global variables
let cart = [];
let totalAmount = 0;

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

// Load order summary from database
async function loadOrderSummary() {

  const orderItemsContainer = document.getElementById("orderItems");
  const orderTotalContainer = document.getElementById("orderTotal");
  const paypalAmount = document.getElementById("paypalAmount");

  try {
    const response = await fetch(`${API_BASE_URL}/cart`, getFetchOptions());

    if (response.ok) {
      const data = await response.json();
      cart = data.data.cartItems;

      if (cart.length === 0) {
        window.location.href = "./cart.html";
        return;
      }

      let orderHTML = "";
      totalAmount = 0;

      cart.forEach((cartItem) => {
        const product = cartItem.product;
        const itemTotal = parseFloat(product.price) * cartItem.quantity;
        totalAmount += itemTotal;

        orderHTML += `
          <div class="order-item">
            <div class="order-item-info">
              <h6>${product.name}</h6>
              <div class="order-item-quantity">Qty: ${cartItem.quantity}</div>
            </div>
            <div class="order-item-price">$${itemTotal.toFixed(2)}</div>
          </div>
        `;
      });

      orderItemsContainer.innerHTML = orderHTML;

      orderTotalContainer.innerHTML = `
        <div class="total-row">
          <span>Total:</span>
          <span>$${totalAmount.toFixed(2)}</span>
        </div>
      `;

      paypalAmount.textContent = `Total: $${totalAmount.toFixed(2)}`;
    } else {
      orderItemsContainer.innerHTML =
        '<div class="text-center">Error loading order</div>';
    }
  } catch (error) {
    orderItemsContainer.innerHTML =
      '<div class="text-center">Network error</div>';
  }
}

// Load user information
function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (user.firstName) {
    document.getElementById("firstName").value = user.firstName;
  }
  if (user.lastName) {
    document.getElementById("lastName").value = user.lastName;
  }
  if (user.email) {
    document.getElementById("email").value = user.email;
  }
}

// Setup payment method selection
function setupPaymentMethods() {
  const paymentOptions = document.querySelectorAll(".payment-option");

  paymentOptions.forEach((option) => {
    option.addEventListener("click", function () {
      // Remove active class from all options
      paymentOptions.forEach((opt) => opt.classList.remove("active"));

      // Add active class to clicked option
      this.classList.add("active");

      const method = this.getAttribute("data-method");

      if (method === "card") {
        alert(
          "Credit/Debit card payment coming soon! Please use PayPal for now."
        );
        // Revert to PayPal
        document
          .querySelector('[data-method="paypal"]')
          .classList.add("active");
        this.classList.remove("active");
      }
    });
  });
}

// Process payment (mock)
async function processPayment() {
  // Validate customer form
  const form = document.getElementById("customerForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Collect customer information
  const customerInfo = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    address: document.getElementById("address").value,
  };

  // Prepare order data
  const orderData = {
    items: cart.map((item) => ({
      id: item.productId,
      quantity: item.quantity,
    })),
    customerInfo: customerInfo,
  };

  try {
    // Mock PayPal payment process
    const paymentResult = await mockPayPalPayment();

    if (paymentResult.success) {
      // Create order in backend
      const response = await fetch(
        `${API_BASE_URL}/orders`,
        getFetchOptions({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        })
      );

      if (response.ok) {
        // Clear cart in database
        await fetch(
          `${API_BASE_URL}/cart`,
          getFetchOptions({
            method: "DELETE",
          })
        );

        // Show success message
        showSuccessMessage();
      } else {
        alert("Order creation failed. Please try again.");
      }
    }
  } catch (error) {
    alert("Payment processing failed. Please try again.");
  }
}

// Mock PayPal payment
function mockPayPalPayment() {
  return new Promise((resolve) => {
    // Show processing message
    const paypalButton = document.querySelector(".btn-paypal");
    paypalButton.textContent = "Processing...";
    paypalButton.disabled = true;

    // Simulate payment processing delay
    setTimeout(() => {
      // Mock successful payment
      resolve({ success: true, transactionId: "MOCK_" + Date.now() });
    }, 2000);
  });
}

// Show success message
function showSuccessMessage() {
  const paymentCard = document.querySelector(".payment-card");
  paymentCard.innerHTML = `
    <div class="success-message">
      <h3>🎉 Payment Successful!</h3>
      <p>Thank you for your order. You will receive a confirmation email shortly.</p>
      <p><strong>Transaction ID:</strong> MOCK_${Date.now()}</p>
      <div class="mt-3">
        <a href="./products.html" class="btn btn-primary me-2">Continue Shopping</a>
        <a href="./index.html" class="btn btn-secondary">Go Home</a>
      </div>
    </div>
  `;
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
  setupPaymentMethods();
  setupLogout();
  loadUserInfo();
  loadOrderSummary();
} else {
  window.location.href = "./login.html";
}
