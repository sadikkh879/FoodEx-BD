document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('productId');

  if (!productId) {
    alert('No product selected.');
    return;
  }

try {
  const res = await fetch(`/api/farmer/product-orders/${productId}`);
  const data = await res.json();

  document.getElementById('productTitle').textContent = `Orders for ${data.product_name}`;

  const container = document.getElementById('orders-container');
  container.innerHTML = '';

  if (!data.orders || data.orders.length === 0) {
    container.innerHTML = '<p>No orders yet.</p>';
    return;
  }

  data.orders.forEach(o => {
    const card = document.createElement('div');
    card.classList.add('order-card');

    // Create status dropdown
    const statusSelect = document.createElement('select');
    ['In Progress', 'Packaging', 'On the Way', 'Delivered'].forEach(status => {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = status;
      if (o.status === status) option.selected = true;
      statusSelect.appendChild(option);
    });

    // Handle status change
    statusSelect.addEventListener('change', async () => {
      try {
        const updateRes = await fetch(`/api/farmer/order-status/${o.order_id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: statusSelect.value })
        });
        const updateData = await updateRes.json();
        alert(updateData.message);
      } catch (err) {
        console.error(err);
        alert('Failed to update status.');
      }
    });

    card.innerHTML = `
      <h4>${o.consumer_name}</h4>
      <p><strong>Quantity:</strong> ${o.quantity} kg</p>
      <p><strong>Location:</strong> ${o.division_name}, ${o.district_name}, ${o.upazila_name}</p>
      <p><strong>Details:</strong> ${o.additional_location || ''}</p>
      <p><strong>Contact No:</strong> ${o.mobile_no || ''}</p>
      <p><strong>Date:</strong> ${new Date(o.order_date).toLocaleString()}</p>
    `;

    // Append dropdown after details
    const statusLabel = document.createElement('p');
    statusLabel.innerHTML = `<strong>Status:</strong> `;
    statusLabel.appendChild(statusSelect);
    card.appendChild(statusLabel);

    container.appendChild(card);
  });

} catch (err) {
  console.error(err);
  alert('Error loading orders.');
}

// Logout Handle
document.getElementById('logoutButton').addEventListener("click", function () {
  const confirmLogout = confirm("Are you sure you want to logout?");
  if (confirmLogout) {
    localStorage.clear();
    window.location.href = "consumer_login.html";
  }
});

});
