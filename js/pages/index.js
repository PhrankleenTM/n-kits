const CATEGORY_MEDIA = {
  all: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/><path d="M2 12h20"/></svg>`,
  "premier-league": `<img src="assets/categories/premier-league.svg" alt="">`,
  "la-liga": `<img src="assets/categories/la-liga.svg" alt="">`,
  "serie-a": `<img src="assets/categories/serie-a.svg" alt="">`,
  international: `<span class="flag-stack"><img src="assets/categories/ng.png" alt="Nigeria"><img src="assets/categories/br.png" alt="Brazil"><img src="assets/categories/ar.png" alt="Argentina"></span>`
};

Store.ready().then(() => {
  document.getElementById("categories").innerHTML = CATEGORIES.map(
    (cat) => {
      const slug = cat.slug || cat.id;
      return `
  <a href="/shop?cat=${slug}" class="category-card">
    <div class="icon">${CATEGORY_MEDIA[slug] || cat.icon}</div>
    <h3>${cat.name}</h3>
  </a>
`;
    },
  ).join("");
  const featured = PRODUCTS.filter((p) => p.featured).slice(0, 4);
  renderProducts(
    document.getElementById("featured-products"),
    (featured.length ? featured : PRODUCTS).slice(0, 4),
  );
});
