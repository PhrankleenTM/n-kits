function renderCategoryFilters(activeSlug) {
  const options = [{ slug: "all", name: "All" }].concat(
    CATEGORIES.filter(c => c.slug !== "all")
  );
  document.getElementById("cat-filters").innerHTML = options.map(cat => `
    <label class="filter-option">
      <input type="radio" name="cat" value="${cat.slug}" ${cat.slug === activeSlug ? "checked" : ""} onchange="applyFilters()">
      ${cat.name}
    </label>
  `).join("");
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
