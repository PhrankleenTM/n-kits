const escAccount = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function accountStatusClass(value) {
  return String(value || "pending").toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function accountItemHtml(it) {
  const product = (Store.products || []).find((p) => Number(p.id) === Number(it.product_id)) || getProductById(it.product_id);
  const image = (product && product.image) || it.image || "";
  const custom = it.custom
    ? [
        it.custom.name ? "Name: " + escAccount(it.custom.name) : "",
        it.custom.number ? "No.: " + escAccount(it.custom.number) : ""
      ].filter(Boolean).join(" · ")
    : "";
  return `
    <div class="strip-item">
      <div class="strip-item-image">
        ${image ? `<img src="${escAccount(image)}" alt="">` : '<span>NK</span>'}
      </div>
      <div class="strip-item-main">
        <strong>${escAccount(it.name || "Removed item")}</strong>
        <span class="strip-item-sub">Size ${escAccount(it.size)} · Qty ${Number(it.quantity) || 0}</span>
        ${custom ? `<span class="strip-item-custom">${custom}</span>` : ""}
      </div>
      <span class="strip-item-price">${formatPrice((Number(it.price) || 0) * (Number(it.quantity) || 0))}</span>
    </div>`;
}

function accountOrderStrip(o) {
  const pay = o.payment_status || "unpaid";
  const status = o.status || "pending";
  const date = o.created_at ? new Date(o.created_at).toLocaleDateString() : "—";
  const items = (o.items || []).map(accountItemHtml).join("");
  return `
    <div class="order-strip">
      <div class="strip-items">
        ${items || '<p class="text-muted">No items recorded</p>'}
      </div>
      <div class="strip-side">
        <div class="strip-meta">
          <span class="strip-id">Order #${o.id}</span>
          <span>${date}</span>
        </div>
        <div class="strip-total">${formatPrice(o.total)}</div>
        <div class="strip-badges">
          <span class="status-badge ${accountStatusClass(status)}">${displayLabel(status)}</span>
          <span class="pay-badge ${escAccount(pay)}">${displayLabel(pay)}</span>
        </div>
      </div>
    </div>`;
}

Store.ready().then(authReady).then(() => {
  if (!requireAuth()) return;

  const user = getCurrentUser();
  const myOrders = Store.orders.filter(
    o => (user.email && o.customer_email === user.email) || (user.id && o.user_id === user.id)
  );

  const ordersHtml = myOrders.length
    ? myOrders.map(accountOrderStrip).join("")
    : `<div class="account-card"><p class="text-muted" style="font-size:0.9rem">No orders yet — add jerseys to your cart and check out on WhatsApp.</p></div>`;

  document.getElementById("account-content").innerHTML = `
    <h1 class="section-title">Hello, ${user.name.split(" ")[0]}</h1>
    <div class="account-heading">
      <h3>My Orders</h3>
      <a href="shop.html" class="btn btn-secondary btn-sm">Start Shopping</a>
    </div>
    <div class="account-order-strips">
      ${ordersHtml}
    </div>
    <div class="account-card">
      <h3 style="margin-bottom:10px">Cart</h3>
      <p class="text-muted" style="font-size:0.9rem">You have ${getCartCount()} item(s) in your cart.</p>
      <a href="cart.html" class="btn btn-primary btn-sm" style="margin-top:12px">View Cart</a>
    </div>
    <button type="button" class="btn btn-logout" style="margin-top:16px" onclick="logout()">Log out</button>
  `;
});
