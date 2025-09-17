const token = localStorage.getItem('token');
const consumerId = localStorage.getItem('consumerId');

if (!consumerId) {
  alert('You must log in first.');
  window.location.href = 'consumer_login.html';
}

//Slidebar handle
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

async function loadProductDetails() {
  try {
    const res = await fetch(`/api/consumer/singleProduct/${productId}`);
    if (!res.ok) throw new Error('Product not found');

    const product = await res.json();

    document.getElementById('productName').textContent = product.product_name;
    document.getElementById('productImage').src = `${product.image}`;
    document.getElementById('productImage').alt = product.product_name;
    document.getElementById('productPrice').textContent = `Price: ${product.price}tk`;
    document.getElementById('productLocation').textContent = `Delivery Location: ${product.delivery_location} hub`;
    document.getElementById('productDescription').textContent = product.product_details || 'No description available.';
    // const status = document.createElement('p');
    // status.textContent = '🚚 Delivery in progress';
    // status.style.color = '#28a745';
    // status.style.fontWeight = 'bold';
    // document.getElementById('productIsDelivered').appendChild(status); // or any container you use

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

  // New location fields
const divisionName = divisionSelect.options[divisionSelect.selectedIndex].text;
const districtName = districtSelect.options[districtSelect.selectedIndex].text;
const upazilaName = upazilaSelect.options[upazilaSelect.selectedIndex].text;
const additionalLocation = document.getElementById('additionalLocation').value.trim();

  // Basic checks
  if (!consumerId || !productId) {
    alert('Missing consumer or product info.');
    return;
  }

  if (isNaN(qtyNum) || qtyNum < 20 || qtyNum > 50) {
    alert('Please enter a valid quantity between 20kg and 50kg.');
    return;
  }

  if (!mobileNo || !divisionName || !districtName || !upazilaName) {
    alert('Please select your all the field');
    return;
  }

  if (!additionalLocation) {
    alert('Please enter additional location details (e.g., house no, road no, area).');
    return;
  }

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
        additional_location: additionalLocation
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


// location dropdown
const divisionSelect = document.getElementById('divisionSelect');
const districtSelect = document.getElementById('districtSelect');
const upazilaSelect = document.getElementById('upazilaSelect');
const additionaInfo = document.getElementById('additionalLocation');

// Load Divisions
async function loadDivisions() {
  try {
    const res = await fetch('https://sohojapi.vercel.app/api/divisions');
    const divisions = await res.json();
    divisions.forEach(div => {
      const opt = document.createElement('option');
      opt.value = div.id; // store ID for next API call
      opt.textContent = `${div.name} (${div.bn_name})`;
      divisionSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading divisions:', err);
  }
}

// Load Districts for selected Division
async function loadDistricts(divisionId) {
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

// Load Upazilas for selected District
async function loadUpazilas(districtId) {
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
    additionaInfo.disabled = false;
  } catch (err) {
    console.error('Error loading upazilas:', err);
  }
}

// Event listeners
divisionSelect.addEventListener('change', e => loadDistricts(e.target.value));
districtSelect.addEventListener('change', e => loadUpazilas(e.target.value));

// Init
document.addEventListener('DOMContentLoaded', loadDivisions);

// Check if already ordered
async function checkIfOrdered() {
  const consumerId = localStorage.getItem('consumerId');
  const productId = new URLSearchParams(window.location.search).get('id');

  const res = await fetch(`/api/consumer/orders/check?consumer_id=${consumerId}&product_id=${productId}`);
  const data = await res.json();

 if (data.ordered) {
    const orderBtn = document.getElementById('orderBtn');
    const trackBtn = document.getElementById('orderTrackBtn');

    orderBtn.disabled = true;
    orderBtn.textContent = 'Already Ordered';
    trackBtn.style.display = 'block'; // ✅ correct way
  }
}
checkIfOrdered();

// track order button handle
document.getElementById('orderTrackBtn').addEventListener("click", function () {
    window.location.href = "consumer_order.html";
});

async function loadOrderProgress() {
  const productId = new URLSearchParams(window.location.search).get('id');
  const res = await fetch(`/api/consumer/products/${productId}/progress`, {
    headers: {
      Authorization: 'Bearer ' + localStorage.getItem('token')
    }
  });

  const data = await res.json();

  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';

  progressBar.innerHTML = `
    <div class="progress-track">
      <div class="progress-fill" style="width: ${data.progressPercent}%"></div>
    </div>
    <p>${data.totalOrdered}kg ordered out of minimum ${data.minOrder}kg required to process the delivery</p>
  `;

  document.querySelector('.productDetails').appendChild(progressBar);
}
loadOrderProgress();

document.addEventListener('DOMContentLoaded', loadProductDetails);
