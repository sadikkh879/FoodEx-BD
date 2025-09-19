/* full-updated-bulk-product-page-allow-free-input.js */

const token = localStorage.getItem('token');
const consumerId = localStorage.getItem('consumerId');

if (!consumerId) {
  alert('You must log in first.');
  window.location.href = 'consumer_login.html';
}

// Sidebar handle (defensive)
const toggleBtn = document.getElementById("toggleBtn");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("closeSidebar");
const overlay = document.getElementById("sidebarOverlay");

if (toggleBtn && sidebar && overlay && closeSidebar) {
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
}

// Logout Handle (defensive)
const logoutBtnEl = document.getElementById('logoutButton');
if (logoutBtnEl) {
  logoutBtnEl.addEventListener("click", function () {
    const confirmLogout = confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.clear();
      window.location.href = "consumer_login.html";
    }
  });
}

const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

// Global variables for order limit check & price
let maxOrderQnt = 0;
let totalOrdered = 0;
let productPrice = 0; // unit price (tk) used to calculate total

/* -------------------------
   Load product details
   ------------------------- */
async function loadProductDetails() {
  try {
    if (!productId) {
      console.warn('No product id supplied in URL');
      return;
    }

    const res = await fetch(`/api/consumer/singleProduct/${encodeURIComponent(productId)}`);
    if (!res.ok) throw new Error('Product not found');

    const product = await res.json();

    // Store max_order globally
    maxOrderQnt = product.max_order || 0;

    // set productPrice so totals can be computed
    productPrice = parseFloat(product.price) || 0;

    const elName = document.getElementById('productName');
    const elImg = document.getElementById('productImage');
    const elPrice = document.getElementById('productPrice');
    const elLocation = document.getElementById('productLocation');
    const elDesc = document.getElementById('productDescription');

    if (elName) elName.textContent = product.product_name || '';
    if (elImg) {
      elImg.src = product.image || '';
      elImg.alt = product.product_name || 'product image';
    }
    if (elPrice) elPrice.textContent = `Price: ${product.price}tk`;
    if (elLocation) elLocation.textContent = `Delivery Hub Location: ${product.delivery_location || ''} hub`;
    if (elDesc) elDesc.textContent = product.product_details || 'No description available.';

    // After setting productPrice, update total display if qty exists
    updateTotal();

    // Check if we already have totalOrdered loaded
    checkOrderLimit();
  } catch (err) {
    console.error(err);
    alert('Error loading product details.');
  }
}

/* -------------------------
   Order modal + UI wiring
   ------------------------- */
const orderModal = document.getElementById('orderModal');
const orderBtn = document.getElementById('orderBtn');
const submitOrderBtn = document.getElementById('submitOrder');
const cancelOrderBtn = document.getElementById('cancelOrder');

// Modal open/close
if (orderBtn && orderModal) {
  orderBtn.addEventListener('click', () => {
    // ensure qty min/max attributes are set on open (for browsers)
    const qtyEl = document.getElementById('orderQty');
    if (qtyEl) {
      qtyEl.min = 20;
      qtyEl.max = 50;
      // don't force value — let user type freely
      if (!qtyEl.value) qtyEl.value = '';
    }
    // show modal
    orderModal.style.display = 'flex';
    updateTotal();
  });
}
if (cancelOrderBtn && orderModal) {
  cancelOrderBtn.addEventListener('click', () => {
    orderModal.style.display = 'none';
  });
}

/* -------------------------
   Payment UI handling
   ------------------------- */
function setupPaymentSelection(paymentSelect, paymentDetails, paymentQR) {
  if (!paymentSelect) return;
  paymentSelect.addEventListener('change', () => {
    const method = paymentSelect.value;
    if (method === 'bkash' || method === 'nagad') {
      if (paymentQR) paymentQR.src = 'https://foodeximages.blob.core.windows.net/consumer-profiles/6226763403452598521.jpg';
      if (paymentDetails) paymentDetails.style.display = 'block';
    } else {
      if (paymentDetails) paymentDetails.style.display = 'none';
    }
  });
}

/* -------------------------
   Qty / Total helpers (no clamping while typing)
   ------------------------- */
function updateTotal() {
  const qtyInput = document.getElementById('orderQty');
  const totalPriceEl = document.getElementById('totalPrice');
  if (!qtyInput || !totalPriceEl) return;
  const qtyNum = parseFloat(qtyInput.value) || 0;
  const payPrice = (productPrice || 0) * qtyNum;
  totalPriceEl.textContent = Number.isFinite(payPrice) ? payPrice.toFixed(2) : '0.00';
}

function flashTotal() {
  const totalPriceContainer = document.getElementById('total-price');
  if (!totalPriceContainer) return;
  totalPriceContainer.classList.remove('flash');
  void totalPriceContainer.offsetWidth; // force reflow
  totalPriceContainer.classList.add('flash');
}

// show inline warning under qty input when out of allowed range
function showQtyWarning(message) {
  const qtyInput = document.getElementById('orderQty');
  if (!qtyInput) return;
  let warning = qtyInput.nextElementSibling;
  // if the immediate next sibling is not the warning, try to find existing by class
  if (!warning || !warning.classList || !warning.classList.contains('qty-warning')) {
    warning = document.querySelector('.qty-warning');
  }
  if (!warning) {
    // create a small <div> after the qty input
    warning = document.createElement('div');
    warning.className = 'qty-warning';
    warning.style.color = '#b71c1c';
    warning.style.fontSize = '0.9rem';
    warning.style.marginTop = '6px';
    // insert after qtyInput
    qtyInput.parentNode.insertBefore(warning, qtyInput.nextSibling);
  }
  warning.textContent = message;
  warning.style.display = message ? 'block' : 'none';
}

/* -------------------------
   Order submission
   ------------------------- */
if (submitOrderBtn) {
  submitOrderBtn.addEventListener('click', async () => {
    const consumerIdLocal = localStorage.getItem('consumerId');
    const tokenLocal = localStorage.getItem('token');
    const paramsLocal = new URLSearchParams(window.location.search);
    const productIdLocal = paramsLocal.get('id');

    const qtyInputEl = document.getElementById('orderQty');
    const mobileEl = document.getElementById('mobileNo');
    const paymentSelectEl = document.getElementById('paymentOption');
    const transactionIdEl = document.getElementById('transactionId');
    const deliveryOptionEl = document.getElementById('deliveryOption');

    const qtyNum = qtyInputEl ? parseFloat(qtyInputEl.value) : NaN;
    const mobileNo = mobileEl ? mobileEl.value.trim() : '';
    const deliveryOpt = deliveryOptionEl ? deliveryOptionEl.value : '';

    // Basic checks
    if (!consumerIdLocal || !productIdLocal) {
      alert('Missing consumer or product info.');
      return;
    }

    // enforce min/max 20-50 on submit
    const minQ = 20;
    const maxQ = 50;
    if (isNaN(qtyNum) || qtyNum < minQ || qtyNum > maxQ) {
      alert(`Please enter a valid quantity between ${minQ}kg and ${maxQ}kg.`);
      // also show inline warning
      showQtyWarning(`Quantity must be between ${minQ} and ${maxQ} kg.`);
      return;
    } else {
      // clear any warning
      showQtyWarning('');
    }

    if (!mobileNo) {
      alert('Please Enter your mobile no');
      return;
    }

    if (!deliveryOpt) {
      alert('Please select a delivery option.');
      return;
    }

    // Payment validation
    let paymentMethod = '';
    if (paymentSelectEl) paymentMethod = paymentSelectEl.value || '';

    let transactionId = '';
    if (transactionIdEl) transactionId = transactionIdEl.value.trim();

    if (!paymentMethod) {
      alert('Please select a payment method.');
      return;
    }
    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !transactionId) {
      alert('Please enter your transaction ID for the selected mobile payment.');
      return;
    }

    // Prepare request body
    const body = {
      consumer_id: consumerIdLocal,
      product_id: productIdLocal,
      quantity: qtyNum,
      mobile_no: mobileNo,
      payment_method: paymentMethod,
      transaction_id: transactionId || null,
      delivery_option: deliveryOpt
    };

    // optimistic UI lock
    submitOrderBtn.disabled = true;
    const prevText = submitOrderBtn.textContent;
    submitOrderBtn.textContent = 'Submitting...';

    try {
      const res = await fetch('/api/consumer/bulk-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + tokenLocal
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert('✅ Order placed successfully!');
        if (orderModal) orderModal.style.display = 'none';
        window.location.reload();
      } else {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        alert('❌ Order failed: ' + (err.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Server error while placing order.');
    } finally {
      submitOrderBtn.disabled = false;
      submitOrderBtn.textContent = prevText;
    }
  });
}

/* -------------------------
   Check if already ordered
   ------------------------- */
async function checkIfOrdered() {
  const consumerIdLocal = localStorage.getItem('consumerId');
  const productIdLocal = new URLSearchParams(window.location.search).get('id');

  try {
    const res = await fetch(`/api/consumer/bulk-orders/check?consumer_id=${encodeURIComponent(consumerIdLocal)}&product_id=${encodeURIComponent(productIdLocal)}`);
    if (!res.ok) return;
    const data = await res.json();

    if (data.ordered) {
      const orderBtnEl = document.getElementById('orderBtn');
      const trackBtn = document.getElementById('orderTrackBtn');

      if (orderBtnEl) {
        orderBtnEl.disabled = true;
        orderBtnEl.textContent = 'Already Ordered';
      }
      if (trackBtn) trackBtn.style.display = 'block';
    }
  } catch (err) {
    console.error(err);
  }
}

/* -------------------------
   Order progress (progress bar)
   ------------------------- */
async function loadOrderProgress() {
  const productIdLocal = new URLSearchParams(window.location.search).get('id');
  try {
    const res = await fetch(`/api/consumer/bulk-products/${encodeURIComponent(productIdLocal)}/progress`, {
      headers: {
        Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
      }
    });
    if (!res.ok) return;
    const data = await res.json();

    // Store totalOrdered globally
    totalOrdered = data.totalOrdered || 0;

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';

    progressBar.innerHTML = `
      <div class="progress-track">
        <div class="progress-fill" style="width: ${Number.isFinite(data.progressPercent) ? data.progressPercent : 0}%"></div>
      </div>
      <p>${data.totalOrdered || 0}kg ordered out of minimum ${data.minOrder || 0}kg required to process the delivery</p>
    `;

    const productDetailsEl = document.querySelector('.productDetails');
    if (productDetailsEl) productDetailsEl.appendChild(progressBar);

    // Check limit now that we have data
    checkOrderLimit();
  } catch (err) {
    console.error(err);
  }
}

/* -------------------------
   Check order limit enforcement
   ------------------------- */
function checkOrderLimit() {
  if (maxOrderQnt && totalOrdered) {
    if (totalOrdered >= maxOrderQnt) {
      const orderBtnEl = document.getElementById('orderBtn');
      if (orderBtnEl) {
        orderBtnEl.disabled = true;
        orderBtnEl.textContent = 'Order Limit Reached';
      }
    }
  }
}

/* -------------------------
   Wire UI on DOM ready
   ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // load product info & progress
  loadProductDetails();
  loadOrderProgress();

  // Wire up payment UI if present in modal
  const paymentSelectEl = document.getElementById('paymentOption');
  const paymentDetailsEl = document.getElementById('paymentDetails');
  const paymentQREl = document.getElementById('paymentQR');
  const transactionIdEl = document.getElementById('transactionId');
  setupPaymentSelection(paymentSelectEl, paymentDetailsEl, paymentQREl);

  // ensure transaction input required only when needed
  if (paymentSelectEl && transactionIdEl) {
    paymentSelectEl.addEventListener('change', () => {
      const m = paymentSelectEl.value;
      transactionIdEl.required = (m === 'bkash' || m === 'nagad');
    });
  }

  // Wire qty -> total with flash animation (no clamping)
  const qtyInput = document.getElementById('orderQty');
  const totalPriceEl = document.getElementById('totalPrice');
  const totalPriceContainer = document.getElementById('total-price');

  if (qtyInput) {
    // ensure min/max attributes exist (for native browser hints), but don't clamp value
    qtyInput.min = 20;
    qtyInput.max = 50;
    // don't override user input; leave blank if empty
    // if you want a default value, set it here (we leave blank)
  }

  if (qtyInput && totalPriceEl && totalPriceContainer) {
    // initialize display
    updateTotal();

    qtyInput.addEventListener('input', () => {
      // Update total in real time (even if out of allowed range)
      updateTotal();

      // Show inline warning if outside allowed range (non-blocking)
      const val = parseFloat(qtyInput.value);
      const minQ = 20;
      const maxQ = 50;
      if (isNaN(val) || val === 0) {
        // no warning on empty / zero input
        showQtyWarning('');
      } else if (val < minQ) {
        showQtyWarning(`Minimum order is ${minQ} kg.`);
      } else if (val > maxQ) {
        showQtyWarning(`Maximum order is ${maxQ} kg.`);
      } else {
        showQtyWarning(''); // clear warning
      }

      // tiny flash to highlight total change
      flashTotal();
    });
  }

  // wire track button
  const trackBtnEl = document.getElementById('orderTrackBtn');
  if (trackBtnEl) {
    trackBtnEl.addEventListener("click", function () {
      window.location.href = "consumer_order.html";
    });
  }

 async function loadSimilarProducts() {

  try {
    const res = await fetch('/api/consumer/products');
    const products = await res.json();
    const slider = document.getElementById('productSlider');

    const createCard = (p) => {
  const card = document.createElement('div');
  card.classList.add('product-card');
  card.innerHTML = `
    <img src="${p.image}" alt="${p.product_name}" />
    <h3>${p.product_name}</h3>
    <p id="product_details">${p.product_details}</p>
    <p><strong>${p.price} Tk</strong></p>
    <button class="landingProductBtn">Get Now</button>
  `;

  // Attach click event to the button
  card.querySelector('.landingProductBtn').addEventListener('click', () => {
    window.location.href = 'consumer_login.html';
  });

  return card;
};
    // Append original products
    products.forEach(p => slider.appendChild(createCard(p)));

    // Duplicate for seamless loop
    products.forEach(p => slider.appendChild(createCard(p)));

  } catch (err) {
    console.error('Failed to load products:', err);
  }
    
 }

 loadSimilarProducts();

  // initial check if already ordered
  checkIfOrdered();
});
