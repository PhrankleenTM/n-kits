/* ============================================
   N-KITS – Cart + WhatsApp order
   ============================================ */

const CART_KEY = "retrokit_cart";
const DEFAULT_CUSTOMIZATION_FEE = 3000;
let memoryCart = null;

function getCustomizationFee() {
  const raw = typeof Store !== "undefined" ? Store.getSetting("customization_fee") : DEFAULT_CUSTOMIZATION_FEE;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_CUSTOMIZATION_FEE;
}

function normalizeCustomName(value) {
  return String(value || "").trim().slice(0, 15);
}

function normalizeCustomNumber(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 2);
}

function customEnabled(item) {
  if (!item || !item.custom) return false;
  return Boolean(
    normalizeCustomName(item.custom.name) ||
    normalizeCustomNumber(item.custom.number)
  );
}

function isCustomized(item) {
  return customEnabled(item);
}

function formatCustom(item) {
  if (!isCustomized(item)) return "";
  const name = normalizeCustomName(item.custom.name);
  const number = normalizeCustomNumber(item.custom.number);
  return [name && "Name: " + name, number && "No.: " + number].filter(Boolean).join(" · ");
}

function getCustomizationTotal() {
  return getCart().reduce((sum, item) => (
    sum + (isCustomized(item) ? getCustomizationFee() * (Number(item.quantity) || 0) : 0)
  ), 0);
}

function validateCustomization() {
  for (const item of getCart()) {
    if (!customEnabled(item)) continue;
    const name = normalizeCustomName(item.custom.name);
    const number = normalizeCustomNumber(item.custom.number);
    if (name && !/^[A-Za-z0-9 ]+$/.test(name)) {
      showToast("Jersey name uses letters, numbers and spaces only");
      return false;
    }
    if (number && !/^\d{1,2}$/.test(number)) {
      showToast("Jersey number must be 0–99");
      return false;
    }
  }
  return true;
}

/* WhatsApp number + intro line come from admin -> Settings (Store layer).
   Falls back to DEFAULT_WHATSAPP_NUMBER in js/config.js. */
function whatsappNumber() {
  if (typeof Store !== "undefined") return Store.getWhatsAppNumber();
  return typeof DEFAULT_WHATSAPP_NUMBER === "string" ? DEFAULT_WHATSAPP_NUMBER : "";
}

function getCart() {
  if (memoryCart) return memoryCart;
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return memoryCart || [];
  }
}

function saveCart(cart) {
  memoryCart = cart;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {}
  updateCartBadge();
}

function addToCart(id, size, qty) {
  id = Number(id);
  qty = Number(qty) || 1;
  size = size || "M";
  const cart = getCart();
  const existing = cart.find(i => Number(i.id) === id && i.size === size);
  if (existing) existing.quantity += qty;
  else cart.push({ id, size, quantity: qty });
  saveCart(cart);
  showToast("Added to cart");
  return true;
}

function removeFromCart(id, size) {
  saveCart(getCart().filter(i => !(Number(i.id) === Number(id) && i.size === size)));
}

function updateQuantity(id, size, qty) {
  const cart = getCart();
  const item = cart.find(i => Number(i.id) === Number(id) && i.size === size);
  if (item) {
    item.quantity = Math.max(1, Number(qty));
    saveCart(cart);
  }
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
}

function getCartSubtotal() {
  return getCart().reduce((sum, i) => {
    const p = getProductById(i.id);
    return sum + (p ? p.price * (Number(i.quantity) || 0) : 0);
  }, 0);
}

function getCartTotal() {
  return getCartSubtotal() + getCustomizationTotal();
}

function clearCart() {
  memoryCart = [];
  try { localStorage.removeItem(CART_KEY); } catch (e) {}
  updateCartBadge();
}

function updateCartBadge() {
  const badges = document.querySelectorAll(".cart-badge");
  const count = getCartCount();
  badges.forEach(badge => {
    const prev = parseInt(badge.textContent, 10) || 0;
    badge.textContent = String(count);
    badge.style.display = count > 0 ? "flex" : "none";
    if (count > prev) {
      badge.classList.remove("pop");
      void badge.offsetWidth;
      badge.classList.add("pop");
    }
  });
}

function buildOrderMessage(extras) {
  const cart = getCart();
  const prefill =
    typeof Store !== "undefined" ? Store.getSetting("whatsapp_prefill") : "";
  const extra = extras || {};
  const lines = [];
  lines.push(prefill || "Hi N-KITS, I want to place an order:");
  lines.push("");
  cart.forEach((item, i) => {
    const p = getProductById(item.id);
    if (!p) return;
    lines.push((i + 1) + ". " + p.name);
    lines.push("   Size: " + item.size + "  |  Qty: " + item.quantity);
    lines.push("   " + formatPrice(p.price * item.quantity));
    const custom = formatCustom(item);
    if (custom) lines.push("   Custom: " + custom);
    lines.push("");
  });
  const customTotal = getCustomizationTotal();
  if (customTotal) lines.push("Customization: " + formatPrice(customTotal));
  lines.push("Total: " + formatPrice(getCartTotal()));
  const name = extra.customer_name || "";
  const email = extra.customer_email || "";
  if (name) {
    lines.push("");
    lines.push("Name: " + name);
    if (email) lines.push("Email: " + email);
  }
  if (extra.phone) lines.push("Phone: " + extra.phone);
  if (extra.address || extra.city) {
    lines.push("Delivery: " + [extra.address, extra.city].filter(Boolean).join(", "));
  }
  if (extra.note) lines.push("Note: " + extra.note);
  lines.push("");
  lines.push("Please confirm availability and payment details. Thanks!");
  return lines.join("\n");
}

function buildOrderPayload(extras) {
  const cart = getCart();
  const extra = extras || {};
  return {
    customer_name: extra.customer_name || "Guest",
    customer_email: extra.customer_email || "",
    total: getCartTotal(),
    customization_total: getCustomizationTotal(),
    items: cart.map((item) => {
      const p = getProductById(item.id);
      return {
        product_id: item.id,
        name: p ? p.name : "Removed item",
        size: item.size,
        quantity: item.quantity,
        price: p ? p.price : 0,
        custom: customEnabled(item)
          ? {
              name: normalizeCustomName(item.custom.name),
              number: normalizeCustomNumber(item.custom.number)
            }
          : null
      };
    }),
    ...(extras || {})
  };
}

async function sendWhatsAppOrder(extras) {
  const cart = getCart();
  if (!cart.length) {
    showToast("Your cart is empty");
    return;
  }
  if (!validateCustomization()) return;

  const fields = extras || {};
  const message = buildOrderMessage(fields);
  const payload = buildOrderPayload({
    ...fields,
    payment_channel: "whatsapp",
    payment_status: "unpaid"
  });
  const url =
    typeof Store !== "undefined"
      ? Store.buildWhatsAppUrl(message)
      : "https://wa.me/" + whatsappNumber() + "?text=" + encodeURIComponent(message);
  const waWindow = window.open(url, "_blank");
  if (!waWindow) showToast("Allow pop-ups to open WhatsApp");

  let orderId = null;
  if (typeof Store !== "undefined") {
    try {
      orderId = await Store.createOrder(payload);
    } catch (e) {
      console.warn("Order not saved", e);
    }
  }
  if (orderId) {
    try { sessionStorage.setItem("retrokit_last_wa_order", String(orderId)); } catch (e) {}
    const snapshot =
      typeof Store !== "undefined"
        ? Store.orders.find((o) => Number(o.id) === Number(orderId)) || null
        : null;
    if (snapshot) {
      try { sessionStorage.setItem("retrokit_last_wa_order_snapshot", JSON.stringify(snapshot)); } catch (e) {}
    }
  }
  try { sessionStorage.setItem("retrokit_wa_order_pending", "1"); } catch (e) {}
  window.location.href = "/order-sent" + (orderId ? "?order=" + encodeURIComponent(orderId) : "");
}

function placeOrderOnWhatsApp() {
  sendWhatsAppOrder();
}

function showToast(message) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}

document.addEventListener("DOMContentLoaded", updateCartBadge);