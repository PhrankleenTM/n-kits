const $os = (id) => document.getElementById(id);
const escOs = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const osParams = new URLSearchParams(window.location.search);
const osRead = (key) => { try { return sessionStorage.getItem(key); } catch (e) { return null; } };
const osOrderId = Number(osParams.get("order")) || Number(osRead("retrokit_last_wa_order")) || null;

function osConfirmedKey() {
  return "retrokit_wa_order_confirmed_" + (osOrderId || "guest");
}

function showConfirmed() {
  $os("pending-panel").hidden = true;
  $os("confirmed-panel").hidden = false;
}

function renderOrder(order) {
  if (!order) {
    $os("sent-summary").innerHTML = '<p class="text-muted">Your order details were sent on WhatsApp. We will confirm them with you there.</p>';
    return;
  }

  $os("sent-order-id").hidden = false;
  $os("sent-order-number").textContent = "#" + order.id;
  $os("sent-status").textContent = "Payment: " + displayLabel(order.payment_status || "unpaid") + " · Status: " + displayLabel(order.status || "pending");

  const items = (order.items || []).map((it) => {
    const custom = it.custom
      ? [
          it.custom.name ? "Name: " + escOs(it.custom.name) : "",
          it.custom.number ? "No.: " + escOs(it.custom.number) : ""
        ].filter(Boolean).join(" · ")
      : "";
    return `
      <div class="sent-line">
        <span>${escOs(it.name)}<small>Size ${escOs(it.size)} × ${it.quantity}${custom ? `<em>${custom}</em>` : ""}</small></span>
        <span>${formatPrice((Number(it.price) || 0) * (Number(it.quantity) || 0))}</span>
      </div>`;
  }).join("");

  $os("sent-summary").innerHTML = `
    <div class="sent-lines">${items}</div>
    <div class="sent-line sent-total"><span>Total</span><span>${formatPrice(Number(order.total) || 0)}</span></div>`;
}

$os("confirm-sent-btn").addEventListener("click", () => {
  clearCart();
  try {
    sessionStorage.setItem(osConfirmedKey(), "1");
    sessionStorage.removeItem("retrokit_wa_order_pending");
  } catch (e) {}
  showConfirmed();
  showToast("Order confirmed — cart cleared");
});

Store.getOrders()
  .then((orders) => {
    renderOrder(osOrderId ? orders.find((o) => Number(o.id) === osOrderId) : null);
    try { sessionStorage.removeItem("retrokit_wa_order_pending"); } catch (e) {}
  })
  .catch(() => renderOrder(null));

if (osRead(osConfirmedKey()) === "1") showConfirmed();
