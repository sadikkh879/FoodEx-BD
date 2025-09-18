const token = localStorage.getItem('token');
const consumerId = localStorage.getItem('consumerId');

if (!consumerId) {
  alert('You must log in first.');
  window.location.href = 'consumer_login.html';
}

// Sidebar handle
const toggleBtn = document.getElementById("toggleBtn");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("closeSidebar");
const overlay = document.getElementById("sidebarOverlay");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
});

closeSidebar.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});

overlay.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});

// Logout Handle
document.getElementById('logoutButton').addEventListener("click", function () {
  const confirmLogout = confirm("Are you sure you want to logout?");
  if (confirmLogout) {
    localStorage.clear();
    window.location.href = "consumer_login.html";
  }
});

const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

// Global variables for order limit check
let maxOrderQnt = 0;
let totalOrdered = 0;

async function loadProductDetails() {
  try {
    const res = await fetch(`/api/consumer/singleProduct/${productId}`);
    if (!res.ok) throw new Error('Product not found');

    const product = await res.json();

    // Store max_order globally
    maxOrderQnt = product.max_order;

    document.getElementById('productName').textContent = product.product_name;
    document.getElementById('productImage').src = `${product.image}`;
    document.getElementById('productImage').alt = product.product_name;
    document.getElementById('productPrice').textContent = `Price: ${product.price}tk`;
    document.getElementById('productLocation').textContent = `Delivery Hub Location: ${product.delivery_location} hub`;
    document.getElementById('productDescription').textContent = product.product_details || 'No description available.';

    // Check if we already have totalOrdered loaded
    checkOrderLimit();
  } catch (err) {
    console.error(err);
    alert('Error loading product details.');
  }
}

// Order Modal
const orderModal = document.getElementById('orderModal');
const orderBtn = document.getElementById('orderBtn');
const submitOrderBtn = document.getElementById('submitOrder');
const cancelOrderBtn = document.getElementById('cancelOrder');

orderBtn.addEventListener('click', () => {
  orderModal.style.display = 'flex';
});

cancelOrderBtn.addEventListener('click', () => {
  orderModal.style.display = 'none';
});

// Order Submission
submitOrderBtn.addEventListener('click', async () => {
  const consumerId = localStorage.getItem('consumerId');
  const token = localStorage.getItem('token');
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  const qtyNum = parseInt(document.getElementById('orderQty').value);
  const mobileNo = document.getElementById('mobileNo').value.trim();

  // Basic checks
  if (!consumerId || !productId) {
    alert('Missing consumer or product info.');
    return;
  }

  if (isNaN(qtyNum) || qtyNum < 20 || qtyNum > 50) {
    alert('Please enter a valid quantity between 20kg and 50kg.');
    return;
  }

  if (!mobileNo) {
    alert('Please Enter your mobile no');
    return;
  }

  try {
    const res = await fetch('/api/consumer/bulk-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({
        consumer_id: consumerId,
        product_id: productId,
        quantity: qtyNum,
        mobile_no: mobileNo,
      })
    });

    if (res.ok) {
      alert('✅ Order placed successfully!');
      orderModal.style.display = 'none';
      window.location.reload();
    } else {
      const err = await res.json();
      alert('❌ Order failed: ' + err.message);
    }
  } catch (err) {
    console.error(err);
    alert('Server error while placing order.');
  }
});

// Check if already ordered
async function checkIfOrdered() {
  const consumerId = localStorage.getItem('consumerId');
  const productId = new URLSearchParams(window.location.search).get('id');

  const res = await fetch(`/api/consumer/bulk-orders/check?consumer_id=${consumerId}&product_id=${productId}`);
  const data = await res.json();

  if (data.ordered) {
    const orderBtn = document.getElementById('orderBtn');
    const trackBtn = document.getElementById('orderTrackBtn');

    orderBtn.disabled = true;
    orderBtn.textContent = 'Already Ordered';
    trackBtn.style.display = 'block';
  }
}
checkIfOrdered();

// Track order button handle
document.getElementById('orderTrackBtn').addEventListener("click", function () {
  window.location.href = "consumer_order.html";
});

async function loadOrderProgress() {
  const productId = new URLSearchParams(window.location.search).get('id');
  const res = await fetch(`/api/consumer/bulk-products/${productId}/progress`, {
    headers: {
      Authorization: 'Bearer ' + localStorage.getItem('token')
    }
  });

  const data = await res.json();

  // Store totalOrdered globally
  totalOrdered = data.totalOrdered;

  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';

  progressBar.innerHTML = `
    <div class="progress-track">
      <div class="progress-fill" style="width: ${data.progressPercent}%"></div>
    </div>
    <p>${data.totalOrdered}kg ordered out of minimum ${data.minOrder}kg required to process the delivery</p>
  `;

  document.querySelector('.productDetails').appendChild(progressBar);

  // Check if we already have maxOrderQnt loaded
  checkOrderLimit();
}

// Function to disable order button if limit reached
function checkOrderLimit() {
  if (maxOrderQnt && totalOrdered) {
    if (totalOrdered >= maxOrderQnt) {
      const orderBtn = document.getElementById('orderBtn');
      orderBtn.disabled = true;
      orderBtn.textContent = 'Order Limit Reached';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProductDetails();
  loadOrderProgress();
});
