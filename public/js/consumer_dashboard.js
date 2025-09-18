const consumerId= localStorage.getItem('consumerId');

document.addEventListener('DOMContentLoaded', async () => {
    if (!consumerId) {
        alert('You must log in first.');
        window.location.href = 'consumer_login.html';
        return;
    }
    await loadProducts();
});

async function loadProducts() {

  // Load Single Products
    try {
    const res = await fetch('/api/consumer/products');
    const products = await res.json();

    const container = document.querySelector('#products-container');
    container.innerHTML = '';

    products.forEach((p, index) => {
    const priceNum = parseFloat(p.price) || 0;
    const mPrice = priceNum + priceNum * (3 / 100);
    const discountPercent = (((mPrice - priceNum) / mPrice) * 100).toFixed(0);

    const card = document.createElement('div');
    card.classList.add('product-card');
    card.style.setProperty('--card-index', index); // for animation delay

    card.innerHTML = `
        <img src="${p.image}" alt="${p.product_name}" />
        <h3 id="productName">${p.product_name}</h3>
        <p id="mPrice">Regular price: ${mPrice.toFixed(0)}tk</p>
        <p id="cPrice">Offer Price: ${p.price}tk 
            <span class="discount-badge">-${discountPercent}%</span>
        </p>
        <p>Fresh from: ${p.location}</p>
        <button id="viewBtn" onclick="go(${p.id}, ${p.is_bulk})">View</button>
    `;

    if (p.is_delivering) {
        const status = document.createElement('p');
        status.textContent = '🚚 Delivery in progress';
        status.style.color = '#28a745';
        status.style.fontWeight = 'bold';
        card.appendChild(status);
    }

    container.appendChild(card);
});
    } catch (err) {
        console.error(err);
        alert('Error loading products.');
    }

    //Bulk products load
    try {
        const res = await fetch('/api/consumer/bulk-products');
        const products = await res.json();

        const container = document.querySelector('#bulk-products');
        container.innerHTML = '';

        products.forEach((p, index) => {
    const priceNum = parseFloat(p.price) || 0;
    const mPrice = priceNum + priceNum * (3 / 100);
    const discountPercent = (((mPrice - priceNum) / mPrice) * 100).toFixed(0);

    const card = document.createElement('div');
    card.classList.add('product-card');
    card.style.setProperty('--card-index', index); // for animation delay

    card.innerHTML = `
        <img src="${p.image}" alt="${p.product_name}" />
        <h3 id="productName">${p.product_name}</h3>
        <p id="mPrice">Regular price: ${mPrice.toFixed(0)}tk</p>
        <p id="cPrice">Offer Price: ${p.price}tk 
            <span class="discount-badge">-${discountPercent}%</span>
        </p>
        <p>Fresh from: ${p.location}</p>
        <button id="viewBtn" onclick="go(${p.id}, ${p.is_bulk})">View</button>
    `;

    if (p.is_delivering) {
        const status = document.createElement('p');
        status.textContent = '🚚 Delivery in progress';
        status.style.color = '#28a745';
        status.style.fontWeight = 'bold';
        card.appendChild(status);
    }

    container.appendChild(card);
});
    } catch (err) {
        console.error(err);
        alert('Error loading products.');
    }

}

function go(id, is_bulk) {
  if (is_bulk === 1) {
    window.location.href = `product_bulk.html?id=${id}`;
  } else {
    window.location.href = `product.html?id=${id}`;
  }
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



document.getElementById('logoutButton').addEventListener("click", function (){
const confirmLogout = confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.clear(); 
      window.location.href = "landing.html";
    }
});