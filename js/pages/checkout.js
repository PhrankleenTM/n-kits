const $co = (id) => document.getElementById(id);
const escCo = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

function renderSummary() {
  const cart = getCart();
  if (!cart.length) {
    $co("checkout-empty").hidden = false;
    $co("checkout-layout").hidden = true;
    return;
  }
  $co("checkout-empty").hidden = true;
  $co("checkout-layout").hidden = false;

  const rows = cart.map((item) => {
    const p = getProductById(item.id);
    if (!p) return "";
    return `
      <div class="summary-item">
        <span class="summary-name">${escCo(p.name)}<small>Size ${escCo(item.size)} × ${item.quantity}</small></span>
        <span>${formatPrice(p.price * item.quantity)}</span>
      </div>`;
  }).join("");

  const customRows = cart.map((item, index) => {
    const p = getProductById(item.id);
    if (!p) return "";
    const name = item.custom ? normalizeCustomName(item.custom.name) : "";
    const number = item.custom ? normalizeCustomNumber(item.custom.number) : "";
    return `
      <div class="customize-row" data-index="${index}">
        <span class="customize-product">${escCo(p.name)}<small>Size ${escCo(item.size)} × ${item.quantity}</small></span>
        <div class="customize-options">
          <div class="customize-option">
            <label class="customize-toggle">
              <input type="checkbox" class="custom-name-toggle" data-index="${index}" ${name ? "checked" : ""}>
              Add name
            </label>
            <input type="text" class="custom-name" data-index="${index}" maxlength="15" placeholder="Name on jersey" value="${escCo(name)}" ${name ? "" : "disabled"}>
          </div>
          <div class="customize-option">
            <label class="customize-toggle">
              <input type="checkbox" class="custom-number-toggle" data-index="${index}" ${number ? "checked" : ""}>
              Add number
            </label>
            <input type="text" class="custom-number" data-index="${index}" inputmode="numeric" maxlength="2" placeholder="No." value="${escCo(number)}" ${number ? "" : "disabled"}>
          </div>
        </div>
      </div>`;
  }).join("");

  const customTotal = getCustomizationTotal();
  const feeText = $co("custom-fee-text");
  if (feeText) feeText.textContent = formatPrice(getCustomizationFee());
  const customContainer = $co("customize-items");
  if (customContainer) customContainer.innerHTML = customRows;

  $co("co-summary").innerHTML = `
    <h2>Order summary</h2>
    <div class="summary-items">${rows}</div>
    <div class="summary-row"><span>Subtotal</span><span id="summary-subtotal">${formatPrice(getCartSubtotal())}</span></div>
    <div class="summary-row" id="customization-row" ${customTotal ? "" : "hidden"}><span>Customization</span><span id="summary-customization">${formatPrice(customTotal)}</span></div>
    <div class="summary-row"><span>Shipping</span><span class="text-muted">Confirm on WhatsApp</span></div>
    <div class="summary-row total"><span>Total</span><span id="summary-total">${formatPrice(getCartTotal())}</span></div>
    <p class="secure-note">
      <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
      Order confirmation and payment details are arranged on WhatsApp.
    </p>`;
  bindCustomization();
}

function bindCustomization() {
  document.querySelectorAll(".customize-row").forEach((row) => {
    const index = Number(row.dataset.index);
    const nameToggle = row.querySelector(".custom-name-toggle");
    const numberToggle = row.querySelector(".custom-number-toggle");
    const nameInput = row.querySelector(".custom-name");
    const numberInput = row.querySelector(".custom-number");

    const sync = () => {
      const cart = getCart();
      const item = cart[index];
      if (!item) return;
      nameInput.disabled = !nameToggle.checked;
      numberInput.disabled = !numberToggle.checked;
      numberInput.value = normalizeCustomNumber(numberInput.value);
      nameInput.value = normalizeCustomName(nameInput.value);
      const name = nameToggle.checked ? nameInput.value : "";
      const number = numberToggle.checked ? numberInput.value : "";
      item.custom = name || number ? { name, number } : null;
      saveCart(cart);
      refreshTotals();
    };

    nameToggle.addEventListener("change", sync);
    numberToggle.addEventListener("change", sync);
    nameInput.addEventListener("input", sync);
    numberInput.addEventListener("input", sync);
  });
}

function validateCustomizationFields() {
  for (const row of document.querySelectorAll(".customize-row")) {
    const nameToggle = row.querySelector(".custom-name-toggle");
    const numberToggle = row.querySelector(".custom-number-toggle");
    if (nameToggle && nameToggle.checked && !row.querySelector(".custom-name").value.trim()) {
      showToast("Enter the jersey name or turn off Add name");
      return false;
    }
    if (numberToggle && numberToggle.checked && !row.querySelector(".custom-number").value.trim()) {
      showToast("Enter the jersey number or turn off Add number");
      return false;
    }
  }
  return true;
}

function refreshTotals() {
  const subtotal = $co("summary-subtotal");
  if (subtotal) subtotal.textContent = formatPrice(getCartSubtotal());
  const customTotal = getCustomizationTotal();
  const customRow = $co("customization-row");
  const customAmount = $co("summary-customization");
  if (customRow) customRow.hidden = !customTotal;
  if (customAmount) customAmount.textContent = formatPrice(customTotal);
  const total = $co("summary-total");
  if (total) total.textContent = formatPrice(getCartTotal());
}

function readForm(requireAll) {
  const val = (id) => $co(id).value.trim();
  const data = {
    customer_name: val("co-name"),
    customer_email: val("co-email").toLowerCase(),
    phone: onlyDigits(val("co-phone")),
    address: val("co-address"),
    city: val("co-city"),
    note: val("co-note"),
    name: val("co-name"),
    email: val("co-email").toLowerCase()
  };
  if (!requireAll) return data;

  if (data.customer_name.length < 2) { showToast("Enter your full name"); $co("co-name").focus(); return null; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) { showToast("Enter a valid email address"); $co("co-email").focus(); return null; }
  if (data.phone.length < 7) { showToast("Enter a valid phone number"); $co("co-phone").focus(); return null; }
  if (data.address.length < 5) { showToast("Enter your delivery address"); $co("co-address").focus(); return null; }
  if (data.city.length < 2) { showToast("Enter your city / state"); $co("co-city").focus(); return null; }
  return data;
}

function orderOnWhatsApp() {
  if (!validateCustomizationFields()) return;
  const form = readForm(true);
  if (!form) return;
  sendWhatsAppOrder({
    customer_name: form.customer_name,
    customer_email: form.customer_email,
    phone: form.phone,
    address: form.address,
    city: form.city,
    note: form.note
  });
}

Store.ready().then(authReady).then(() => {
  const user = getCurrentUser();
  if (user) {
    if (!$co("co-name").value) $co("co-name").value = user.name || "";
    if (!$co("co-email").value) $co("co-email").value = user.email || "";
  }
  renderSummary();
});

$co("wa-btn").addEventListener("click", orderOnWhatsApp);
