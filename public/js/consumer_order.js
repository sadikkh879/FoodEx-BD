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

    orders.forEach(order => {
      const card = document.createElement('div');
      card.classList.add('product-card'); // use same styling as dashboard

      card.innerHTML = `
        <img src="${order.image}" alt="${order.product_name}" />
        <div class="card-body">
          <h3>${order.product_name}<br>Ordered: ${order.quantity} kg</h3>
          <p>Delivery Hub: ${order.delivery_location}</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${order.progressPercent}%"></div>
          </div>
          <p>Progress: ${order.progressPercent.toFixed(1)}%</p>
          ${order.is_delivering ? '<p style="color:#28a745;font-weight:bold;">🚚 Delivery in progress</p>' : ''}
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
