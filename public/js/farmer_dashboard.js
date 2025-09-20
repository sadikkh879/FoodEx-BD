const farmerId = localStorage.getItem('farmerId');

document.addEventListener('DOMContentLoaded', () => {
    if (!farmerId) {
        alert('You must log in first.');
        window.location.href = 'farmer_login.html';
        return;
    }

    loadProducts();

    // Toggle between bulk and single product forms
    document.getElementById('addBulkBtn').addEventListener('click', () => {
        document.getElementById('add-product').style.display = 'block';
        document.getElementById('single-product').style.display = 'none';
    });

    document.getElementById('addSingleBtn').addEventListener('click', () => {
        document.getElementById('single-product').style.display = 'block';
        document.getElementById('add-product').style.display = 'none';
    });

    // Bulk product form handler
    document.getElementById('add-product-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Adding...';

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
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // Single product form handler
    document.getElementById('addSingle-product-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Adding...';

        const formData = new FormData(this);
        formData.append('farmerId', farmerId);

        try {
            const res = await fetch('/api/farmer/addSingle-product', {
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
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // Sidebar
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

    // Logout
    document.getElementById('logout').addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) {
            localStorage.clear();
            window.location.href = "landing.html";
        }
    });
});

// Load products
async function loadProducts() {
    try {
        const res = await fetch(`/api/farmer/products/${farmerId}`);
        const products = await res.json();
        const container = document.querySelector('#products-container');
        if (container) {
            container.innerHTML = '';
            products.forEach(p => {
                const card = document.createElement('div');
                card.classList.add('product-card');
                card.innerHTML = `
                    <img src="${p.image}" alt="${p.product_name}" />
                    <h3>${p.product_name}</h3>
                    <p id="product_details">${p.product_details}</p>
                    <p><strong>Price:</strong> ${p.price} Tk</p>
                    <p><strong>Ordered:</strong> ${p.totalOrdered} kg</p>
                `;
                const viewOrdersBtn = document.createElement('button');
                const deleteOrdersBtn = document.createElement('button');
                viewOrdersBtn.textContent = '📦 View Orders';
                deleteOrdersBtn.textContent = 'Delete';
                viewOrdersBtn.classList.add('view-orders-btn');
                viewOrdersBtn.addEventListener('click', () => {
                    window.location.href = `farmer_order_tracking.html?productId=${p.id}`;
                });
                card.appendChild(viewOrdersBtn);
                card.appendChild(deleteOrdersBtn);
                container.appendChild(card);
            });
        }
    } catch (err) {
        console.error(err);
        alert('Error loading products.');
    }

    try {
        const res = await fetch(`/api/farmer/bulk-products/${farmerId}`);
        const products = await res.json();
        const container = document.querySelector('#bulk-products-container');
        if (container) {
            container.innerHTML = '';
            products.forEach(p => {
                const card = document.createElement('div');
                card.classList.add('product-card');
                card.innerHTML = `
                    <img src="${p.image}" alt="${p.product_name}" />
                    <h3>${p.product_name}</h3>
                    <p id="product_details">${p.product_details}</p>
                    <p><strong>Price:</strong> ${p.price} Tk</p>
                    <p><strong>Ordered:</strong> ${p.totalOrdered} kg</p>
                `;
                const viewOrdersBtn = document.createElement('button');
                const deleteOrdersBtn = document.createElement('button');
                viewOrdersBtn.textContent = '📦 View Orders';
                deleteOrdersBtn.textContent = 'Delete';
                viewOrdersBtn.classList.add('view-orders-btn');
                viewOrdersBtn.addEventListener('click', () => {
                    window.location.href = `farmer_order_tracking.html?productId=${p.id}`;
                });
                card.appendChild(viewOrdersBtn);
                card.appendChild(deleteOrdersBtn);
                container.appendChild(card);
            });
        }
    } catch (err) {
        console.error(err);
        alert('Error loading products.');
    }
}
