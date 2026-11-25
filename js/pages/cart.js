const escCart = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function renderCart() {
  const cart = getCart();
  const el = document.getElementById("cart-content");

  if (!cart.length) {
    el.innerHTML = `
      <div class="empty-state">
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any jerseys yet.</p>
        <a href="shop.html" class="btn btn-primary">Browse Jerseys</a>
      </div>`;
    return;
  }

  const items = cart.map(item => {
    const p = getProductById(item.id);
    if (!p) return "";
    return `
      <div class="cart-item">
        <img src="${p.image}" alt="${p.name}">
        <div class="cart-item-info">
          <h3>${p.name}</h3>
          <div class="size">Size: ${escCart(item.size)}</div>
          ${isCustomized(item) ? `<div class="custom-line">Custom: ${escCart(formatCustom(item))}</div>` : ""}
          <div class="qty-controls">
            <button type="button" class="qty-btn" onclick="changeQty(${item.id},'${item.size}',${item.quantity - 1})">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button type="button" class="qty-btn" onclick="changeQty(${item.id},'${item.size}',${item.quantity + 1})">+</button>
          </div>
          <a class="cart-item-remove" onclick="removeItem(${item.id},'${item.size}')">Remove</a>
          <div class="cart-item-price">${formatPrice(p.price * item.quantity)}</div>
        </div>
      </div>`;
  }).join("");

  const subtotal = getCartSubtotal();
  const customTotal = getCustomizationTotal();
  el.innerHTML = `
    <div class="cart-items stagger">${items}</div>
    <div class="cart-summary">
      <h2>Order Summary</h2>
      <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      ${customTotal ? `<div class="summary-row"><span>Customization</span><span>${formatPrice(customTotal)}</span></div>` : ""}
      <div class="summary-row"><span>Shipping</span><span class="text-muted">Confirm on WhatsApp</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatPrice(getCartTotal())}</span></div>
      <button type="button" class="btn btn-primary btn-block" style="margin-top:20px" onclick="placeOrderOnWhatsApp()">
        Order on WhatsApp
      </button>
      <a href="shop.html" class="btn btn-ghost btn-block" style="margin-top:10px">Continue Shopping</a>
    </div>`;
}

function changeQty(id, size, qty) {
  if (qty < 1) removeFromCart(id, size);
  else updateQuantity(id, size, qty);
  renderCart();
}

function removeItem(id, size) {
  removeFromCart(id, size);
  showToast("Item removed");
  renderCart();
}

Store.ready().then(renderCart);
