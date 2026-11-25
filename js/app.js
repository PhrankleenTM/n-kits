/* ============================================
   N-KITS – Shared UI helpers
   ============================================ */

function createProductCard(product) {
  const defaultSize = product.sizes[0];
  return `
    <article class="product-card">
      <a href="product.html?id=${product.id}" class="product-image">
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </a>
      <div class="product-info">
        <div class="product-club">${product.club}</div>
        <a href="product.html?id=${product.id}" class="product-name">${product.name}</a>
        <div class="product-price">${formatPrice(product.price)}</div>
        <div class="product-actions">
          <button type="button" class="btn btn-primary btn-sm btn-block"
            onclick="event.preventDefault(); addToCart(${product.id}, '${defaultSize}', 1);">
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts(container, products) {
  if (!container) return;
  if (!products.length) {
    container.innerHTML = `<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px 0;">No jerseys found.</p>`;
    return;
  }
  container.classList.remove("stagger");
  container.innerHTML = products.map(createProductCard).join("");
  void container.offsetWidth;
  container.classList.add("stagger");
}

function toggleMobileMenu() {
  const menu = document.querySelector(".mobile-nav");
  if (menu) menu.classList.toggle("open");
}

function goBack(fallback) {
  if (document.referrer && document.referrer.indexOf(location.host) !== -1) {
    history.back();
  } else {
    window.location.href = fallback || "index.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Mark section titles for subtle reveal if desired
  document.querySelectorAll(".section-title, .trust-grid").forEach(el => {
    el.classList.add("reveal");
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
  }
});