Store.ready().then(() => {
  const params = new URLSearchParams(window.location.search);
  const product = getProductById(params.get("id"));
  const content = document.getElementById("product-content");

  if (!product) {
    content.innerHTML = `
      <div class="empty-state">
        <h2>Jersey not found</h2>
        <a href="shop.html" class="btn btn-primary">Back to Shop</a>
      </div>`;
    return;
  }

  document.title = product.name + " – N-KITS";
  const gallery = (product.images && product.images.length ? product.images : [product.image]).filter(Boolean);
  let coverIndex = 0;
  let selectedSize = product.sizes[0];
  let quantity = 1;

  content.innerHTML = `
    <div class="product-detail">
      <div class="product-gallery" style="animation:scaleIn 0.45s var(--ease-out) both">
        <img id="gallery-main" src="${gallery[0] || ""}" alt="${product.name}">
        ${gallery.length > 1 ? `
          <div class="gallery-thumbs">
            ${gallery.map((src, i) => `<button type="button" class="gallery-thumb ${i === 0 ? "active" : ""}" data-src="${src}" data-i="${i}"><img src="${src}" alt=""></button>`).join("")}
          </div>` : ""}
      </div>
      <div class="product-meta">
        <div class="club" style="animation:fadeUp 0.45s var(--ease-out) 0.08s both;opacity:0">${product.club} · ${product.league}</div>
        <h1 style="animation:fadeUp 0.45s var(--ease-out) 0.14s both;opacity:0">${product.name}</h1>
        <div class="price" style="animation:fadeUp 0.45s var(--ease-out) 0.2s both;opacity:0">${formatPrice(product.price)}</div>
        <p class="desc" style="animation:fadeUp 0.45s var(--ease-out) 0.26s both;opacity:0">${product.description}</p>
        <div class="size-selector" style="animation:fadeUp 0.45s var(--ease-out) 0.32s both;opacity:0">
          <label>Select Size</label>
          <div class="size-options">
            ${product.sizes.map(s => `<button type="button" class="size-btn ${s === selectedSize ? "active" : ""}" data-size="${s}">${s}</button>`).join("")}
          </div>
        </div>
        <div class="qty-selector" style="animation:fadeUp 0.45s var(--ease-out) 0.38s both;opacity:0">
          <label>Quantity</label>
          <div class="qty-controls">
            <button type="button" class="qty-btn" id="q-minus">−</button>
            <span class="qty-value" id="q-val">1</span>
            <button type="button" class="qty-btn" id="q-plus">+</button>
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-block" id="add-btn" style="margin-top:8px;padding:14px;animation:fadeUp 0.45s var(--ease-out) 0.44s both;opacity:0">
          Add to Cart — ${formatPrice(product.price)}
        </button>
        <a class="btn btn-secondary btn-block" id="wa-btn" style="margin-top:10px" href="#" target="_blank" rel="noopener">
          Ask on WhatsApp
        </a>
      </div>
    </div>`;

  const waBtn = document.getElementById("wa-btn");
  if (waBtn) {
    waBtn.href = Store.buildWhatsAppUrl(
      "Hi N-KITS, I'm interested in: " + product.name + " (" + formatPrice(product.price) + ")"
    );
  }

  document.querySelectorAll(".gallery-thumb").forEach(btn => {
    btn.addEventListener("click", () => {
      coverIndex = Number(btn.dataset.i);
      document.getElementById("gallery-main").src = btn.dataset.src;
      document.querySelectorAll(".gallery-thumb").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  function updateAddBtn() {
    document.getElementById("add-btn").textContent =
      "Add to Cart — " + formatPrice(product.price * quantity);
  }

  document.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedSize = btn.dataset.size;
      document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  document.getElementById("q-minus").onclick = () => {
    if (quantity > 1) {
      quantity--;
      document.getElementById("q-val").textContent = quantity;
      updateAddBtn();
    }
  };
  document.getElementById("q-plus").onclick = () => {
    quantity++;
    document.getElementById("q-val").textContent = quantity;
    updateAddBtn();
  };
  document.getElementById("add-btn").onclick = () => {
    addToCart(product.id, selectedSize, quantity);
  };
});
