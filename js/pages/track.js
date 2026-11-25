const $t = (id) => document.getElementById(id);
const escT = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const TRACK_LIMIT = 5;
const TRACK_WINDOW = 10 * 60 * 1000;
const TRACK_CLIENT_KEY = "retrokit_track_client";
const TRACK_LIMIT_KEY = "retrokit_track_limit";

function trackClientKey() {
  let key = "";
  try { key = localStorage.getItem(TRACK_CLIENT_KEY) || ""; } catch (e) {}
  if (!key) {
    key = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "track-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    try { localStorage.setItem(TRACK_CLIENT_KEY, key); } catch (e) {}
  }
  return key;
}

function trackLimitState() {
  let state = null;
  try { state = JSON.parse(localStorage.getItem(TRACK_LIMIT_KEY) || "null"); } catch (e) {}
  if (!state || !state.resetAt || state.resetAt <= Date.now()) {
    state = { count: 0, resetAt: Date.now() + TRACK_WINDOW };
  }
  return state;
}

function saveTrackLimit(state) {
  try { localStorage.setItem(TRACK_LIMIT_KEY, JSON.stringify(state)); } catch (e) {}
}

function clearTrackLimit() {
  try { localStorage.removeItem(TRACK_LIMIT_KEY); } catch (e) {}
}

function showTrackError(message) {
  $t("track-error").textContent = message;
  $t("track-error").hidden = false;
}

function clearTrackError() {
  $t("track-error").textContent = "";
  $t("track-error").hidden = true;
}

function setTrackBusy(busy) {
  $t("track-submit").disabled = busy;
  $t("track-submit").classList.toggle("is-loading", busy);
  $t("track-submit").textContent = busy ? "Checking..." : "Track order";
}

function prefillTracking() {
  const params = new URLSearchParams(window.location.search);
  let orderId = params.get("order");
  let snapshot = null;
  try {
    orderId = orderId || sessionStorage.getItem("retrokit_last_wa_order");
    snapshot = JSON.parse(sessionStorage.getItem("retrokit_last_wa_order_snapshot") || "null");
  } catch (e) {}
  if (orderId) $t("track-order").value = orderId;
  if (snapshot) {
    if (!$t("track-order").value) $t("track-order").value = snapshot.id || "";
    if (!$t("track-match").value) $t("track-match").value = snapshot.phone || snapshot.customer_email || "";
  }
}

function trackDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

function renderTrackedOrder(order) {
  const items = (order.items || []).map((item) => {
    const custom = item.custom
      ? [
          item.custom.name ? "Name: " + escT(item.custom.name) : "",
          item.custom.number ? "No.: " + escT(item.custom.number) : ""
        ].filter(Boolean).join(" · ")
      : "";
    return `
      <div class="track-line">
        <span>${escT(item.name)}<small>Size ${escT(item.size)} × ${item.quantity}${custom ? `<em>${custom}</em>` : ""}</small></span>
        <span>${formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 0))}</span>
      </div>`;
  }).join("");

  $t("track-heading").textContent = "Order #" + order.id;
  $t("track-status").textContent = "Status: " + displayLabel(order.status || "pending") + " · Payment: " + displayLabel(order.payment_status || "unpaid");
  $t("track-date").textContent = trackDate(order.created_at) ? "Placed " + trackDate(order.created_at) : "";
  $t("track-delivery").textContent = [order.city, order.address].filter(Boolean).join(" · ") || "Delivery details confirmed on WhatsApp";
  $t("track-items").innerHTML = items + `<div class="track-line track-total"><span>Total</span><span>${formatPrice(Number(order.total) || 0)}</span></div>`;
  $t("track-help").href = Store.buildWhatsAppUrl("Hi, please help with order #" + order.id + ".");
  $t("track-result").hidden = false;
  $t("track-result").scrollIntoView({ behavior: "smooth", block: "start" });
}

$t("track-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  clearTrackError();
  $t("track-result").hidden = true;

  const limit = trackLimitState();
  if (limit.count >= TRACK_LIMIT) {
    const seconds = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
    showTrackError("Too many attempts. Try again in " + Math.ceil(seconds / 60) + " minute(s).");
    return;
  }

  const id = String($t("track-order").value).replace(/\D/g, "");
  const match = $t("track-match").value.trim();
  if (!id || Number(id) <= 0) { showTrackError("Enter your order number."); $t("track-order").focus(); return; }
  if (match.length < 5) { showTrackError("Enter the WhatsApp number or email from your order."); $t("track-match").focus(); return; }

  limit.count += 1;
  saveTrackLimit(limit);
  setTrackBusy(true);
  try {
    await Store.ready();
    const order = await Store.trackOrder(Number(id), match, trackClientKey());
    if (!order) {
      showTrackError("No matching order found. Check the order number and the phone or email you used.");
      return;
    }
    clearTrackLimit();
    renderTrackedOrder(order);
  } catch (e) {
    showTrackError(e && e.message ? e.message : "Tracking is unavailable right now. Please try again.");
  } finally {
    setTrackBusy(false);
  }
});

$t("track-another").addEventListener("click", () => {
  $t("track-result").hidden = true;
  $t("track-form").reset();
  clearTrackError();
  $t("track-order").focus();
});

Store.ready().then(prefillTracking);
