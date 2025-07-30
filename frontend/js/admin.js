// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Check admin authentication
function checkAdminAuth() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!user.id || user.role !== 'ADMIN') {
    return false;
  }
  
  return { user };
}

// Get fetch options based on auth type
function getFetchOptions(additionalOptions = {}) {
  const baseOptions = {
    credentials: 'include', // Always include cookies
    ...additionalOptions
  };
  
  return baseOptions;
}

// Setup tab navigation
function setupTabs() {
  const tabButtons = document.querySelectorAll('.sidebar .nav-link');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      
      // Update active button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Show target tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab ) {
          content.classList.add('active');
        }
      });
      
      // Load content based on tab
      if (targetTab === 'products') {
        loadProducts();
      } else if (targetTab === 'orders') {
        loadOrders();
      }
    });
  });
}

// Load all products for admin
async function loadProducts() {
  const tbody = document.getElementById('productsTable');
  
  try {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
    
    const response = await fetch(`${API_BASE_URL}/products?limit=100`, getFetchOptions());
    
    const data = await response.json();
    
    if (response.ok) {
      displayProductsTable(data.data.products);
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Failed to load products</td></tr>';
    }
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Network error</td></tr>';
  }
}

// Display products in admin table
function displayProductsTable(products) {
  const tbody = document.getElementById('productsTable');
  
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
    return;
  }
  
  const productsHTML = products.map(product => `
    <tr>
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>$${product.price}</td>
      <td>${product.stock}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-warning btn-sm" onclick="editProduct(${product.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
  
  tbody.innerHTML = productsHTML;
}

// Load all orders for admin
async function loadOrders() {
  const tbody = document.getElementById('ordersTable');
  
  try {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
    
    const response = await fetch(`${API_BASE_URL}/orders`, getFetchOptions());
    
    const data = await response.json();
    
    if (response.ok) {
      displayOrdersTable(data.data.orders);
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Failed to load orders</td></tr>';
    }
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Network error</td></tr>';
  }
}

// Display orders in admin table
function displayOrdersTable(orders) {
  const tbody = document.getElementById('ordersTable');
  
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
    return;
  }
  
  const ordersHTML = orders.map(order => {
    const statusBadge = getStatusBadge(order.status);
    const orderDate = new Date(order.createdAt).toLocaleDateString();
    
    return `
      <tr>
        <td>${order.id}</td>
        <td>${order.user.firstName} ${order.user.lastName}</td>
        <td>$${order.totalAmount}</td>
        <td>${statusBadge}</td>
        <td>${orderDate}</td>
        <td>
          <button class="btn btn-info btn-sm" onclick="viewOrderDetails(${order.id})">View Details</button>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = ordersHTML;
}

// Get status badge HTML
function getStatusBadge(status) {
  const badges = {
    'pending': '<span class="badge badge-pending">Pending</span>',
    'completed': '<span class="badge badge-completed">Completed</span>',
    'cancelled': '<span class="badge badge-cancelled">Cancelled</span>'
  };
  return badges[status] || status;
}

// Add new product
function setupAddProduct() {
  const form = document.getElementById('addProductForm');
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData();
    
    formData.append('name', document.getElementById('productName').value);
    formData.append('category', document.getElementById('productCategory').value);
    formData.append('price', document.getElementById('productPrice').value);
    formData.append('stock', document.getElementById('productStock').value);
    formData.append('description', document.getElementById('productDescription').value);
    
    const imageFile = document.getElementById('productImage').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/products`, getFetchOptions({
        method: 'POST',
        body: formData
      }));
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Product added successfully!');
        form.reset();
        loadProducts(); // Refresh products list
      } else {
        alert(data.message || 'Failed to add product');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  });
}

// Edit product
async function editProduct(productId) {
  try {
    // Get product details
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, getFetchOptions());
    
    const data = await response.json();
    
    if (response.ok) {
      const product = data.data.product;
      
      // Populate edit form
      document.getElementById('editProductId').value = product.id;
      document.getElementById('editProductName').value = product.name;
      document.getElementById('editProductCategory').value = product.category;
      document.getElementById('editProductPrice').value = product.price;
      document.getElementById('editProductStock').value = product.stock;
      document.getElementById('editProductDescription').value = product.description;
      
      // Show modal
      const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
      modal.show();
    } else {
      alert('Failed to load product details');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

// Save edited product
function setupEditProduct() {
  const saveBtn = document.getElementById('saveEditProduct');
  
  saveBtn.addEventListener('click', async function() {
    const productId = document.getElementById('editProductId').value;
    const formData = new FormData();
    
    formData.append('name', document.getElementById('editProductName').value);
    formData.append('category', document.getElementById('editProductCategory').value);
    formData.append('price', document.getElementById('editProductPrice').value);
    formData.append('stock', document.getElementById('editProductStock').value);
    formData.append('description', document.getElementById('editProductDescription').value);
    
    const imageFile = document.getElementById('editProductImage').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, getFetchOptions({
        method: 'PUT',
        body: formData
      }));
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Product updated successfully!');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
        modal.hide();
        
        loadProducts(); // Refresh products list
      } else {
        alert(data.message || 'Failed to update product');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  });
}

// Delete product
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, getFetchOptions({
      method: 'DELETE'
    }));
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Product deleted successfully!');
      loadProducts(); // Refresh products list
    } else {
      alert(data.message || 'Failed to delete product');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

// View order details
function viewOrderDetails(orderId) {
  alert(`Order details for Order #${orderId} - Feature coming soon!`);
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

// Initialize admin dashboard
if (checkAdminAuth()) {
  setupTabs();
  setupAddProduct();
  setupEditProduct();
  setupLogout();
  loadProducts(); // Load products by default
}else {
  console.error("Admin authentication failed. Redirecting to login page.");
  window.location.href = "./index.html";
}