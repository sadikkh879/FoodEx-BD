// consumer-product.js (refactored)

const TOKEN = localStorage.getItem('token');
const CONSUMER_ID = localStorage.getItem('consumerId');

if (!CONSUMER_ID) {
  alert('You must log in first.');
  window.location.href = 'consumer_login.html';
}

let productPrice = 0; // will be set when product loads
let productIdFromUrl = new URLSearchParams(window.location.search).get('id');

// ---------- helper ----------
const $ = id => document.getElementById(id);

// ---------- main init ----------
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Cache elements (safely)
  const toggleBtn = $('toggleBtn');
  const sidebar = $('sidebar');
  const closeSidebar = $('closeSidebar');
  const overlay = $('sidebarOverlay');

  const logoutButton = $('logoutButton');

  const qtyInput = $('orderQty');
  const totalPriceEl = $('totalPrice');
  const totalPriceContainer = $('total-price');

  const orderModal = $('orderModal');
  const orderBtn = $('orderBtn');
  const submitOrderBtn = $('submitOrder');
  const cancelOrderBtn = $('cancelOrder');
  const orderTrackBtn = $('orderTrackBtn');

  const divisionSelect = $('divisionSelect');
  const districtSelect = $('districtSelect');
  const upazilaSelect = $('upazilaSelect');
  const additionaInfo = $('additionalLocation');

  const paymentSelect = $('paymentOption');
  const paymentDetails = $('paymentDetails');
  const paymentQR = $('paymentQR');
  const transactionIdInput = $('transactionId');

  // guard: required elements may not exist on all pages
  setupSidebar(toggleBtn, sidebar, closeSidebar, overlay);
  setupLogout(logoutButton);

  // Load UI data and attach listeners
  await loadProductDetails(productIdFromUrl); // sets productPrice and product display
  loadDivisions(); // location API

  // Ensure quantity listener is attached only once
  if (qtyInput && totalPriceEl && totalPriceContainer) {
    qtyInput.addEventListener('input', () => {
      const qtyNum = parseInt(qtyInput.value) || 0;
      const payPrice = (productPrice || 0) * qtyNum;
      totalPriceEl.textContent = payPrice.toFixed(2);

      // flash animation restart
      totalPriceContainer.classList.remove('flash');
      void totalPriceContainer.offsetWidth;
      totalPriceContainer.classList.add('flash');
    });
  }

  // Order modal open/close
  if (orderBtn && orderModal) {
    orderBtn.addEventListener('click', () => orderModal.style.display = 'flex');
  }
  if (cancelOrderBtn && orderModal) {
    cancelOrderBtn.addEventListener('click', () => orderModal.style.display = 'none');
  }

  // Payment selection handling
  setupPaymentSelection(paymentSelect, paymentDetails, paymentQR);

  // Location dropdown change handlers
  if (divisionSelect) divisionSelect.addEventListener('change', e => loadDistricts(e.target.value));
  if (districtSelect) districtSelect.addEventListener('change', e => loadUpazilas(e.target.value));

  // Submit order
  if (submitOrderBtn) {
    submitOrderBtn.addEventListener('click', async () => {
      await handleSubmitOrder({
        consumerId: CONSUMER_ID,
        token: TOKEN,
        productId: productIdFromUrl,
        qtyInput,
        divisionSelect,
        districtSelect,
        upazilaSelect,
        additionaInfo,
        paymentSelect,
        transactionIdInput,
        totalPriceEl
      }, orderModal);
    });
  }

  // Check if already ordered (shows track button etc.)
  await checkIfOrdered(CONSUMER_ID, productIdFromUrl);

  // track order button handle
  if (orderTrackBtn) {
    orderTrackBtn.addEventListener('click', () => window.location.href = 'consumer_order.html');
  }
}

// ---------- small modules ----------
function setupSidebar(toggleBtn, sidebar, closeSidebar, overlay) {
  if (!toggleBtn || !sidebar || !closeSidebar || !overlay) return;
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
  });
  closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });
}

function setupLogout(button) {
  if (!button) return;
  button.addEventListener('click', () => {
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      localStorage.clear();
      window.location.href = 'consumer_login.html';
    }
  });
}

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

// ---------- product & UI loading ----------
async function loadProductDetails(productId) {
  if (!productId) {
    console.warn('No product id in URL');
    return;
  }

  try {
    const res = await fetch(`/api/consumer/singleProduct/${productId}`);
    if (!res.ok) throw new Error('Product not found');

    const product = await res.json();
    productPrice = parseFloat(product.price) || 0;

    const nameEl = $('productName');
    const imageEl = $('productImage');
    const priceEl = $('productPrice');
    const descEl = $('productDescription');
    if (nameEl) nameEl.textContent = product.product_name || 'Unnamed product';
    if (imageEl) {
      imageEl.src = product.image || '';
      imageEl.alt = product.product_name || 'product image';
    }
    if (priceEl) priceEl.textContent = `Price: ${product.price}tk`;
    if (descEl) descEl.textContent = product.product_details || 'No description available.';
  } catch (err) {
    console.error(err);
    alert('Error loading product details.');
  }
}

// ---------- location APIs ----------
async function loadDivisions() {
  const divisionSelect = $('divisionSelect');
  if (!divisionSelect) return;
  try {
    const res = await fetch('https://sohojapi.vercel.app/api/divisions');
    const divisions = await res.json();
    divisions.forEach(div => {
      const opt = document.createElement('option');
      opt.value = div.id;
      opt.textContent = `${div.name} (${div.bn_name})`;
      divisionSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading divisions:', err);
  }
}

async function loadDistricts(divisionId) {
  const districtSelect = $('districtSelect');
  const upazilaSelect = $('upazilaSelect');
  const additionaInfo = $('additionalLocation');
  if (!districtSelect || !upazilaSelect) return;

  districtSelect.innerHTML = '<option value="">-- Select District --</option>';
  upazilaSelect.innerHTML = '<option value="">-- Select Upazila --</option>';
  upazilaSelect.disabled = true;

  if (!divisionId) {
    districtSelect.disabled = true;
    return;
  }

  try {
    const res = await fetch(`https://sohojapi.vercel.app/api/districts/${divisionId}`);
    const districts = await res.json();
    districts.forEach(dist => {
      const opt = document.createElement('option');
      opt.value = dist.id;
      opt.textContent = `${dist.name} (${dist.bn_name})`;
      districtSelect.appendChild(opt);
    });
    districtSelect.disabled = false;
  } catch (err) {
    console.error('Error loading districts:', err);
  }
}

async function loadUpazilas(districtId) {
  const upazilaSelect = $('upazilaSelect');
  const additionaInfo = $('additionalLocation');
  if (!upazilaSelect) return;

  upazilaSelect.innerHTML = '<option value="">-- Select Upazila --</option>';
  if (!districtId) {
    upazilaSelect.disabled = true;
    return;
  }

  try {
    const res = await fetch(`https://sohojapi.vercel.app/api/upzilas/${districtId}`);
    const upazilas = await res.json();
    upazilas.forEach(upz => {
      const opt = document.createElement('option');
      opt.value = upz.id;
      opt.textContent = `${upz.name} (${upz.bn_name})`;
      upazilaSelect.appendChild(opt);
    });
    upazilaSelect.disabled = false;
    if (additionaInfo) additionaInfo.disabled = false;
  } catch (err) {
    console.error('Error loading upazilas:', err);
  }
}

// ---------- order submission ----------
async function handleSubmitOrder(ctx, orderModal) {
  const {
    consumerId, token, productId,
    qtyInput, divisionSelect, districtSelect,
    upazilaSelect, additionaInfo,
    paymentSelect, transactionIdInput
  } = ctx;

  if (!consumerId || !productId) {
    alert('Missing consumer or product info.');
    return;
  }

  const qtyNum = parseInt(qtyInput?.value || '0', 10);
  const mobileNo = ($('mobileNo') && $('mobileNo').value) ? $('mobileNo').value.trim() : '';

  const divisionName = divisionSelect?.options[divisionSelect.selectedIndex]?.text || '';
  const districtName = districtSelect?.options[districtSelect.selectedIndex]?.text || '';
  const upazilaName = upazilaSelect?.options[upazilaSelect.selectedIndex]?.text || '';
  const additionalLocation = additionaInfo?.value.trim() || '';
  const paymentMethod = paymentSelect?.value || '';
  const transactionId = transactionIdInput?.value.trim() || '';

  // validation
  if (isNaN(qtyNum) || qtyNum < 20 || qtyNum > 50) {
    alert('Please enter a valid quantity between 20kg and 50kg.');
    return;
  }
  if (!mobileNo || !divisionName || !districtName || !upazilaName) {
    alert('Please select all location fields and enter a mobile number.');
    return;
  }
  if (!additionalLocation) {
    alert('Please enter additional location details (e.g., house no, road no, area).');
    return;
  }
  if (!paymentMethod) {
    alert('Please select a payment method.');
    return;
  }
  if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !transactionId) {
    alert('Please enter your transaction ID.');
    return;
  }

  // submit
  try {
    const res = await fetch('/api/consumer/orders', {
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
        division_name: divisionName,
        district_name: districtName,
        upazila_name: upazilaName,
        additional_location: additionalLocation,
        payment_method: paymentMethod,
        transaction_id: transactionId || null
      })
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
  }
}

// ---------- check if already ordered ----------
async function checkIfOrdered(consumerId, productId) {
  if (!consumerId || !productId) return;
  try {
    const res = await fetch(`/api/consumer/orders/check?consumer_id=${consumerId}&product_id=${productId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.ordered) {
      const orderBtn = $('orderBtn');
      const trackBtn = $('orderTrackBtn');
      if (orderBtn) {
        orderBtn.disabled = true;
        orderBtn.textContent = 'Already Ordered';
      }
      if (trackBtn) trackBtn.style.display = 'block';
    }
  } catch (err) {
    console.error('Error checking order status:', err);
  }
}
