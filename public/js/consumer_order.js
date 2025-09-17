const consumerId = localStorage.getItem('consumerId');

document.addEventListener('DOMContentLoaded', async () => {
  if (!consumerId) {
    alert('You must log in first.');
    window.location.href = 'consumer_login.html';
    return;
  }

  await loadOrders();
});

async function loadOrders() {
  try {
    const res = await fetch(`/api/consumer/orders/summary/${consumerId}`);
    const orders = await res.json();

    const container = document.querySelector('#orders-container');
    container.innerHTML = '';

    if (!orders.length) {
      container.innerHTML = '<p>You have no orders yet.</p>';
      return;
    }

    orders.forEach(order => {
      const card = document.createElement('div');
      card.classList.add('product-card');

      // Color-code status
      let statusColor = '#555';
      if (order.status === 'Delivered') statusColor = '#28a745';
      else if (order.status === 'On the Way') statusColor = '#007bff';
      else if (order.status === 'Packaging') statusColor = '#ff9800';
      else if (order.status === 'In Progress') statusColor = '#9c27b0';

      card.innerHTML = `
        <img src="${order.image}" alt="${order.product_name}" />
        <div class="card-body">
          <h3>${order.product_name}</h3>
          <p><strong>Ordered:</strong> ${order.quantity} kg</p>
          <p><strong>Status:</strong> <span style="color:${statusColor};font-weight:bold;">${order.status || 'Pending'}</span></p>
          <p><strong>Location:</strong> ${order.division_name}, ${order.district_name}, ${order.upazila_name}</p>
          <p><strong>Details:</strong> ${order.additional_location || ''}</p>
          <p><strong>Contact No:</strong> ${order.mobile_no || ''}</p>
          <p><strong>Date:</strong> ${new Date(order.order_date).toLocaleString()}</p>
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    alert('Failed to load your orders.');
  }
}

// Sidebar toggle
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

// Logout
document.getElementById('logoutButton').addEventListener("click", () => {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.clear();
    window.location.href = "landing.html";
  }
});
