const farmerId= localStorage.getItem('farmerId');

document.addEventListener('DOMContentLoaded', async () => {
    if (!farmerId) {
        alert('You must log in first.');
        window.location.href = 'login.html';
        return;
    }
    await loadProducts();
});


//Fetch products
async function loadProducts() {
    try {
        const res = await fetch(`/api/farmer/products/${farmerId}`);
        const products = await res.json();

        const container = document.querySelector('#products-container');
        container.innerHTML = '';

products.forEach(p => {
  const card = document.createElement('div');
  card.classList.add('product-card');
  card.innerHTML = `
    <img src="/uploads/photos/${p.image}" alt="${p.product_name}" />
    <h3>${p.product_name}</h3>
    <p>${p.product_details}</p>
    <p><strong>Price:</strong> ${p.price} Tk</p>
    <p><strong>Min Order:</strong> ${p.min_order}</p>
    <p><strong>Max Order:</strong> ${p.max_order}</p>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${p.progressPercent}%"></div>
    </div>
    <p><strong>Ordered:</strong> ${p.totalOrdered} kg (${p.progressPercent.toFixed(1)}%)</p>
  `;
  container.appendChild(card);

  if (p.totalOrdered >= p.min_order && p.totalOrdered <= p.max_order && !p.is_delivering) {
  const deliverBtn = document.createElement('button');
  deliverBtn.textContent = 'Start Delivering';
  deliverBtn.classList.add('deliver-btn');
  deliverBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`/api/farmer/start-delivery/${p.id}`, {
        method: 'POST'
      });
      const data = await res.json();
      alert(data.message);
      await loadProducts(); // Refresh UI
    } catch (err) {
      console.error(err);
      alert('Failed to start delivery.');
    }
  });
  card.appendChild(deliverBtn);
}

if (p.is_delivering) {
  const status = document.createElement('p');
  status.textContent = '🚚 Delivery in progress';
  status.style.color = '#28a745';
  card.appendChild(status);
}


});

    } catch (err) {
        console.error(err);
        alert('Error loading products.');
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