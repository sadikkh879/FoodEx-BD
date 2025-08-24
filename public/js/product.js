const token = localStorage.getItem('token');
const consumerId = localStorage.getItem('consumerId');

if (!consumerId) {
  alert('You must log in first.');
  window.location.href = 'consumer_login.html';
}

document.getElementById('logout').addEventListener("click", function () {
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

// order handle
document.getElementById('orderBtn').addEventListener('click', async () => {
  const consumerId = localStorage.getItem('consumerId');
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!consumerId || !productId) {
    alert('Missing consumer or product info.');
    return;
  }

  const quantity = prompt('Enter quantity in kg (between 10 and 20):');
  const qtyNum = parseInt(quantity);

  if (isNaN(qtyNum) || qtyNum < 10 || qtyNum > 20) {
    alert('Please enter a valid quantity between 10kg and 20kg.');
    return;
  }

  try {
    const res = await fetch('/api/consumer/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({
        consumer_id: consumerId,
        product_id: productId,
        quantity: qtyNum
      })
    });

    if (res.ok) {
      alert('✅ Order placed successfully!');
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

async function checkIfOrdered() {
  const consumerId = localStorage.getItem('consumerId');
  const productId = new URLSearchParams(window.location.search).get('id');

  const res = await fetch(`/api/consumer/orders/check?consumer_id=${consumerId}&product_id=${productId}`);
  const data = await res.json();

  if (data.ordered) {
    document.getElementById('orderBtn').disabled = true;
    document.getElementById('orderBtn').textContent = 'Already Ordered';
  }
}
checkIfOrdered();

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
