const consumerId = localStorage.getItem('consumerId');

let latestOffset = 0;
let bulkOffset = 0;
const limit = 3;

document.addEventListener('DOMContentLoaded', async () => {
  if (!consumerId) {
    alert('You must log in first.');
    window.location.href = 'consumer_login.html';
    return;
  }

  // Load initial batches
  await loadSection('/api/consumer/products', '#products-container', latestOffset, 'latest');
  await loadSection('/api/consumer/bulk-products', '#bulk-products', bulkOffset, 'bulk');

  // Init slider arrow controls
  initSliders();

  // Hook up Load More buttons
  const loadMoreLatestBtn = document.getElementById('loadMoreLatest');
  const loadMoreBulkBtn = document.getElementById('loadMoreBulk');

  if (loadMoreLatestBtn) {
    loadMoreLatestBtn.addEventListener('click', () => {
      loadSection('/api/consumer/products', '#products-container', latestOffset, 'latest');
    });
  }

  if (loadMoreBulkBtn) {
    loadMoreBulkBtn.addEventListener('click', () => {
      loadSection('/api/consumer/bulk-products', '#bulk-products', bulkOffset, 'bulk');
    });
  }
});

async function loadSection(apiUrl, containerSelector, offset, type) {
  try {
    const res = await fetch(`${apiUrl}?limit=${limit}&offset=${offset}`);
    const products = await res.json();

    const container = document.querySelector(containerSelector);
    if (!container) {
      console.warn('Container not found:', containerSelector);
      return;
    }

    if (!Array.isArray(products) || products.length === 0) {
      if (type === 'latest') {
        document.getElementById('loadMoreLatest')?.style.setProperty('display', 'none');
      } else {
        document.getElementById('loadMoreBulk')?.style.setProperty('display', 'none');
      }
      return;
    }

    // Clear old products (keeps your original behavior)
    container.innerHTML = '';

    // Build cards in a document fragment so each .product-card becomes a grid item
    const frag = document.createDocumentFragment();

    products.forEach((p, index) => {
      const priceNum = parseFloat(p.price) || 0;
      const mPrice = priceNum + priceNum * (3 / 100);
      const discountPercent = (((mPrice - priceNum) / mPrice) * 100).toFixed(0);

      const card = document.createElement('div');
      card.classList.add('product-card');
      card.style.setProperty('--card-index', offset + index);

      // Use classes for price elements (IDs must be unique; classes are safer here)
      card.innerHTML = `
        <img src="${p.image || ''}" alt="${p.product_name || 'Product'}" />
        <h3 id="product_name">${p.product_name || 'Unnamed product'}</h3>
        <p id="mPrice">Regular price: ${Number.isFinite(mPrice) ? mPrice.toFixed(0) : '0'}tk</p>
        <p id="cPrice">Offer Price: ${p.price || '0'}tk 
            <span class="discount-badge">-${discountPercent}%</span>
        </p>
        <p id="product_details">${p.product_details}</p>
        <button onclick="go(${p.id}, ${p.is_bulk})">View</button>
      `;

      if (p.is_delivering) {
        const status = document.createElement('p');
        status.textContent = '🚚 Delivery in progress';
        status.style.color = '#28a745';
        status.style.fontWeight = 'bold';
        card.appendChild(status);
      }

      frag.appendChild(card);
    });

    // Append all cards directly to the grid container (Option A)
    container.appendChild(frag);

    // Update offset for next batch
    if (type === 'latest') {
      latestOffset += limit;
    } else {
      bulkOffset += limit;
    }

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

function initSliders() {
  document.querySelectorAll('.slider-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const slider = document.getElementById(btn.dataset.target);
      const scrollAmount = 250;

      if (btn.classList.contains('prev')) {
        slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });

        // Auto-load next batch if near the end
        if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 50) {
          if (btn.dataset.target === 'products-container') {
            await loadSection('/api/consumer/products', '#products-container', latestOffset, 'latest');
          } else if (btn.dataset.target === 'bulk-products') {
            await loadSection('/api/consumer/bulk-products', '#bulk-products', bulkOffset, 'bulk');
          }
        }
      }
    });
  });
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

// Logout
document.getElementById('logoutButton').addEventListener('click', function () {
  const confirmLogout = confirm('Are you sure you want to logout?');
  if (confirmLogout) {
    localStorage.clear();
    window.location.href = 'landing.html';
  }
});
