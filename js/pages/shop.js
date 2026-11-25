const escShop = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function shopCategoryOptions() {
  const source = (typeof Store !== "undefined" && Store.categories && Store.categories.length)
    ? Store.categories
    : (typeof CATEGORIES !== "undefined" ? CATEGORIES : []);
  const options = [{ slug: "all", name: "All" }];
  source.forEach(cat => {
    const slug = cat.slug || cat.id;
    if (!slug || slug === "all" || options.some(o => o.slug === slug)) return;
    options.push({ slug, name: cat.name || slug });
  });
  return options;
}

function renderCategoryFilters(activeSlug) {
  const options = shopCategoryOptions();
  const selected = options.some(cat => cat.slug === activeSlug) ? activeSlug : "all";
  document.getElementById("cat-filters").innerHTML = options.map(cat => `
    <label class="filter-option">
      <input type="radio" name="cat" value="${escShop(cat.slug)}" ${cat.slug === selected ? "checked" : ""} onchange="setCategory(this.value)">
      ${escShop(cat.name)}
    </label>
  `).join("");

  const catSelect = document.getElementById("cat-select");
  if (catSelect) {
    catSelect.innerHTML = options.map(cat => `<option value="${escShop(cat.slug)}">${escShop(cat.name)}</option>`).join("");
    catSelect.value = selected;
  }
}

function setCategory(value) {
  document.querySelectorAll('input[name="cat"]').forEach(radio => {
    radio.checked = radio.value === value;
  });
  const catSelect = document.getElementById("cat-select");
  if (catSelect) catSelect.value = value;
  applyFilters();
}

function setPrice(value) {
  document.querySelectorAll('input[name="price"]').forEach(radio => {
    radio.checked = radio.value === value;
  });
  const priceSelect = document.getElementById("price-select");
  if (priceSelect) priceSelect.value = value;
  applyFilters();
}

function applyFilters() {
  const cat = document.querySelector('input[name="cat"]:checked')?.value || "all";
  const price = document.querySelector('input[name="price"]:checked')?.value || "all";
  const sort = document.getElementById("sort").value;
  let products = getProductsByCategory(cat);
  if (price === "under80") products = products.filter(p => p.price < 80000);
  if (price === "80to90") products = products.filter(p => p.price >= 80000 && p.price <= 90000);
  if (price === "over90") products = products.filter(p => p.price > 90000);
  if (sort === "price-asc") products.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") products.sort((a, b) => b.price - a.price);
  if (sort === "newest") products.sort((a, b) => b.id - a.id);
  renderProducts(document.getElementById("shop-products"), products);
}

Store.ready().then(() => {
  const params = new URLSearchParams(window.location.search);
  renderCategoryFilters(params.get("cat") || "all");
  applyFilters();

  if (params.get("custom") === "1") {
    const banner = document.getElementById("custom-banner");
    const fee = document.getElementById("custom-fee-label");
    if (banner) banner.hidden = false;
    if (fee) fee.textContent = formatPrice(getCustomizationFee()) + " per jersey";
  }
});
