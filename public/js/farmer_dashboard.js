const farmerId= localStorage.getItem('farmerId');

document.addEventListener('DOMContentLoaded', async () => {
    if (!farmerId) {
        alert('You must log in first.');
        window.location.href = 'login.html';
        return;
    }
    await loadProducts();
});


// Load products and show "View Orders" button
async function loadProducts() {
  try {
    const res = await fetch(`/api/farmer/products/${farmerId}`);
    const products = await res.json();

    const container = document.querySelector('#products-container');
    container.innerHTML = '';

    products.forEach(p => {
      const card = document.createElement('div');
      card.classList.add('product-card');

      // Product info
      card.innerHTML = `
        <img src="${p.image}" alt="${p.product_name}" />
        <h3>${p.product_name}</h3>
        <p>${p.product_details}</p>
        <p><strong>Price:</strong> ${p.price} Tk</p>
        <p><strong>Ordered:</strong> ${p.totalOrdered} kg</p>
      `;

      // View Orders button
      const viewOrdersBtn = document.createElement('button');
      viewOrdersBtn.textContent = '📦 View Orders';
      viewOrdersBtn.classList.add('view-orders-btn');
      viewOrdersBtn.addEventListener('click', () => {
        window.location.href = `farmer_order_tracking.html?productId=${p.id}`;
      });
      card.appendChild(viewOrdersBtn);

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    alert('Error loading products.');
  }
}


// Helper function to update delivery status
async function updateDeliveryStatus(productId, isDelivering) {
  try {
    const res = await fetch(`/api/farmer/delivery-status/${productId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_delivering: isDelivering })
    });
    const data = await res.json();
    alert(data.message);
    await loadProducts();
  } catch (err) {
    console.error(err);
    alert('Failed to update delivery status.');
  }
}


document.getElementById('add-product-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    formData.append('farmerId', farmerId);

    try {
        const res = await fetch('/api/farmer/add-product', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok) {
            await loadProducts();
            this.reset();
        }
    } catch (err) {
        console.error(err);
        alert('Failed to add product.');
    }
});

//Slidebar handle
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleBtn");
const closeBtn = document.querySelector(".closeBtn");
const content = document.querySelector(".content");

toggleBtn.addEventListener("click", () => {
  sidebar.style.width = "250px";
  content.classList.add("shifted");
});

closeBtn.addEventListener("click", () => {
  sidebar.style.width = "0";
  content.classList.remove("shifted");
});



document.getElementById('logout').addEventListener("click", function (){
const confirmLogout = confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.clear(); 
      window.location.href = "landing.html";
    }
});