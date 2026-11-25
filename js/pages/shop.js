const escShop = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function shopPriceBounds() {
  const prices = PRODUCTS.map(product => Number(product.price)).filter(value => Number.isFinite(value) && value >= 0);
  if (!prices.length) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return { min, max, low: min, high: max };
  const span = max - min;
  if (span < 3) return { min, max, low: min, high: max };
  const roundTo = span >= 6000 ? 1000 : span >= 1500 ? 500 : 100;
  let low = Math.round((min + span / 3) / roundTo) * roundTo;
  let high = Math.round((min + (span * 2) / 3) / roundTo) * roundTo;
  low = Math.max(min, Math.min(max, low));
  high = Math.max(min, Math.min(max, high));
  if (low <= min || high >= max || high <= low) {
    low = Math.round(min + span / 3);
    high = Math.round(min + (span * 2) / 3);
  }
  return { min, max, low, high };
}

function shopPriceOptions() {
  const bounds = shopPriceBounds();
  if (!bounds || bounds.low <= bounds.min || bounds.high >= bounds.max || bounds.high <= bounds.low) {
    return [{ value: "all", label: "All" }];
  }
  return [
    { value: "all", label: "All" },
    { value: "under-low", label: `Under ${formatPrice(bounds.low)}` },
    { value: "low-high", label: `${formatPrice(bounds.low)} – ${formatPrice(bounds.high)}` },
    { value: "over-high", label: `Over ${formatPrice(bounds.high)}` }
  ];
}

function renderPriceFilters(selected) {
  const options = shopPriceOptions();
  const safe = options.some(option => option.value === selected) ? selected : "all";
  const group = document.getElementById("price-filters");
  if (group) {
    group.innerHTML = options.map(option => `
      <label class="filter-option">
        <input type="radio" name="price" value="${escShop(option.value)}" ${option.value === safe ? "checked" : ""} onchange="setPrice(this.value)">
        ${escShop(option.label)}
      </label>
    `).join("");
  }
  const priceSelect = document.getElementById("price-select");
  if (priceSelect) {
    priceSelect.innerHTML = options.map(option => `<option value="${escShop(option.value)}">${escShop(option.label)}</option>`).join("");
    priceSelect.value = safe;
  }
}

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
  const bounds = shopPriceBounds();
  if (price === "under-low" && bounds) products = products.filter(p => p.price < bounds.low);
  if (price === "low-high" && bounds) products = products.filter(p => p.price >= bounds.low && p.price <= bounds.high);
  if (price === "over-high" && bounds) products = products.filter(p => p.price > bounds.high);
  if (sort === "price-asc") products.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") products.sort((a, b) => b.price - a.price);
  if (sort === "newest") products.sort((a, b) => b.id - a.id);
  renderProducts(document.getElementById("shop-products"), products);
}

Store.ready().then(() => {
  const params = new URLSearchParams(window.location.search);
  renderCategoryFilters(params.get("cat") || "all");
  renderPriceFilters("all");
  applyFilters();

  if (params.get("custom") === "1") {
    const banner = document.getElementById("custom-banner");
    const fee = document.getElementById("custom-fee-label");
    if (banner) banner.hidden = false;
    if (fee) fee.textContent = formatPrice(getCustomizationFee()) + " per jersey";
  }
});
