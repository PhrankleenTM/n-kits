/* ============================================
   N-KITS – Admin panel
   Dashboard · Jerseys (CRUD) · Categories · Orders · Settings
   Auth: Supabase (profiles.is_admin) or local password
   ============================================ */
(function () {
  "use strict";

  /* ---------- helpers ---------- */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const fld = (form, name) => form.elements.namedItem(name);

  /* Pure-JS SHA-256 (verified against Node crypto) — used to check the
     local admin password without ever shipping a plaintext password. */
  function sha256Hex(input) {
    const K = new Uint32Array([
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);
    const bytes = new TextEncoder().encode(input);
    const bitLen = bytes.length * 8;
    const padded = new Uint8Array((((bytes.length + 8) >> 6) + 1) * 64);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);
    dv.setUint32(padded.length - 4, bitLen >>> 0, false);
    const H = new Uint32Array([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ]);
    const w = new Uint32Array(64);
    for (let off = 0; off < padded.length; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
      for (let i = 16; i < 64; i++) {
        const x = w[i - 15], y = w[i - 2];
        const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return Array.from(H).map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
  }

  function toast(message) {
    if (typeof window.showToast === "function") return window.showToast(message);
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function money(n) {
    return typeof formatPrice === "function" ? formatPrice(n) : "₦" + Number(n || 0).toLocaleString("en-NG");
  }

  function when(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return iso;
    }
  }

  const SIZE_CHIPS = ["S", "M", "L", "XL", "XXL"];
  const BADGES = ["", "Retro", "Classic", "Limited"];

  const ICON_PRESETS = [
    { label: "Globe", svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/><path d="M2 12h20"/></svg>' },
    { label: "League", svg: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 4v16"/></svg>' },
    { label: "Circle", svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8"/></svg>' },
    { label: "Shield", svg: '<svg viewBox="0 0 24 24"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/></svg>' },
    { label: "Trophy", svg: '<svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>' },
    { label: "Star", svg: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9z"/></svg>' },
    { label: "Flag", svg: '<svg viewBox="0 0 24 24"><path d="M5 21V4h14l-3 4 3 4H5"/></svg>' }
  ];

  const TITLES = {
    dashboard: "Dashboard",
    jerseys: "Jerseys",
    jersey: "Jersey",
    categories: "Categories",
    orders: "Orders",
    settings: "Settings"
  };

  /* ---------- session / access ---------- */

  let mode = "local"; // local | supabase
  let loginWired = false;

  async function isAdminUser() {
    const sb = Store.supabase();
    const user = getCurrentUser();
    if (!sb || !user) return false;
    if (user.isAdmin) return true;
    try {
      const { data, error } = await sb.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      if (error) {
        console.warn("profiles lookup failed", error.message);
        return false;
      }
      return Boolean(data && data.is_admin);
    } catch (e) {
      return false;
    }
  }

  async function hasAccess() {
    if (mode === "supabase") {
      const user = getCurrentUser();
      if (!user) return false;
      return isAdminUser();
    }
    try {
      return sessionStorage.getItem("retrokit_admin") === "1";
    } catch (e) {
      return false;
    }
  }

  function setGroup(id, visible) {
    const g = $("#" + id);
    g.style.display = visible ? "" : "none";
    // Hidden fields must be disabled: required inputs that are only hidden by CSS
    // still block form submission with an invisible browser validation bubble.
    g.querySelectorAll("input, select, textarea").forEach((el) => {
      el.disabled = !visible;
    });
  }

  function showAuthCard(message) {
    $("#admin-shell").style.display = "none";
    $("#admin-auth").style.display = "";
    const isSupa = mode === "supabase";
    setGroup("group-email", isSupa);
    setGroup("group-password", isSupa);
    setGroup("group-local", !isSupa);
    $("#auth-subtitle").textContent = isSupa
      ? "Sign in with the Supabase account that has admin access"
      : "Enter the local admin password";
    const configLoaded = typeof LOCAL_ADMIN_PASSWORD_HASH === "string" && LOCAL_ADMIN_PASSWORD_HASH.length > 0;
    if (isSupa) {
      $("#auth-hint").textContent = "";
      $("#auth-hint").style.display = "none";
    } else {
      $("#auth-hint").style.display = "";
      $("#auth-hint").innerHTML = configLoaded
        ? "Local mode — the password is checked against <code>LOCAL_ADMIN_PASSWORD_HASH</code> in js/config.js (only a hash is ever sent to the browser)."
        : '<strong style="color:#d9534f">js/config.js failed to load</strong> — local login is disabled until it does (check the file, then hard-refresh).';
    }
    const err = $("#auth-error");
    if (message) {
      err.style.display = "";
      err.textContent = message;
    } else {
      err.style.display = "none";
    }
    if (!loginWired) {
      loginWired = true;
      $("#admin-login-form").addEventListener("submit", onLoginSubmit);
    }
  }

  async function onLoginSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const err = $("#auth-error");
    const submit = form.querySelector('[type="submit"]');
    err.style.display = "none";
    submit.disabled = true;
    submit.classList.add("is-loading");
    submit.setAttribute("aria-busy", "true");
    try {
      if (mode === "supabase") {
        const res = await login(fld(form, "email").value, fld(form, "password").value);
        if (!res.success) {
          err.style.display = "";
          err.textContent = res.message;
          return;
        }
        if (await isAdminUser()) {
          startApp();
        } else {
          const sb = Store.supabase();
          if (sb) { try { await sb.auth.signOut(); } catch (x) {} }
          setCurrentUser(null);
          showAuthCard("This account does not have admin access.");
        }
        return;
      }

      const localInput = fld(form, "local").value;
      const hash = typeof LOCAL_ADMIN_PASSWORD_HASH === "string" ? LOCAL_ADMIN_PASSWORD_HASH : "";
      if (hash.length === 64 && sha256Hex(localInput) === hash) {
        try { sessionStorage.setItem("retrokit_admin", "1"); } catch (x) {}
        startApp();
      } else if (!hash) {
        err.style.display = "";
        err.textContent =
          "Local admin password is not configured — js/config.js failed to load or LOCAL_ADMIN_PASSWORD_HASH is empty (see console, F12).";
      } else {
        err.style.display = "";
        err.textContent = "Wrong admin password.";
      }
    } catch (ex) {
      console.error("Admin sign-in failed:", ex);
      err.style.display = "";
      err.textContent =
        "Sign-in failed: " + (ex && ex.message ? ex.message : ex) + " — see the browser console (F12).";
    } finally {
      submit.disabled = false;
      submit.classList.remove("is-loading");
      submit.removeAttribute("aria-busy");
    }
  }

  async function adminLogout() {
    try {
      const sb = Store.supabase();
      if (sb) await sb.auth.signOut();
    } catch (e) {}
    try { sessionStorage.removeItem("retrokit_admin"); } catch (e) {}
    setCurrentUser(null);
    showAuthCard();
  }

  function startApp() {
    $("#admin-auth").style.display = "none";
    $("#admin-shell").style.display = "";
    const user = getCurrentUser();
    $("#admin-user").textContent =
      mode === "supabase" && user ? user.email : "Local admin";
    $("#mode-badge").textContent = mode === "supabase" ? "Supabase" : "Local storage";
    $("#mode-badge").className = "mode-badge " + (mode === "supabase" ? "mode-live" : "mode-local");

    const banner = $("#admin-banner");
    if (!isSupabaseConfigured()) {
      banner.style.display = "";
      banner.className = "admin-banner";
      banner.innerHTML =
        "<strong>Local mode.</strong> Data is saved in this browser only. Paste your Supabase keys into <code>js/config.js</code> (schema: <code>supabase/schema.sql</code>) to go live.";
    } else if (!Store.remote) {
      banner.style.display = "";
      banner.className = "admin-banner banner-warn";
      banner.innerHTML =
        "<strong>Supabase unreachable.</strong> Showing locally cached data — new saves go to this browser only.";
    } else {
      banner.style.display = "none";
    }

    route();
  }

  /* ---------- router ---------- */

  function parseRoute() {
    const hash = (location.hash || "#/dashboard").replace(/^#\/?/, "");
    const parts = hash.split("/");
    return { page: parts[0] || "dashboard", param: parts[1] || null };
  }

  function route() {
    if ($("#admin-shell").style.display === "none") return;
    const { page, param } = parseRoute();
    const key = page === "jerseys" && param ? "jersey" : page;
    $("#admin-title").textContent =
      key === "jersey" ? (param && param !== "new" ? "Edit Jersey" : "Add Jersey") : TITLES[key] || "Admin";
    $$(".admin-nav a").forEach((a) => {
      const navKey = a.dataset.nav;
      const active = navKey === page || (navKey === "jerseys" && key === "jersey");
      a.classList.toggle("active", active);
    });
    $("#admin-sidebar").classList.remove("open");

    const render = {
      dashboard: renderDashboard,
      jerseys: renderJerseys,
      jersey: () => renderJerseyForm(param),
      categories: renderCategories,
      orders: renderOrders,
      settings: renderSettings
    }[key] || renderDashboard;

    render();
    window.scrollTo(0, 0);
  }

  /* ---------- dashboard ---------- */

  function renderDashboard() {
    const products = Store.products;
    const categories = Store.categories;
    const orders = Store.orders;
    const revenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pending = orders.filter((o) => o.status === "pending").length;
    const paid = orders.filter((o) => o.payment_status === "paid").length;
    const outOfStock = products.filter((p) => p.in_stock === false).length;

    const recent = orders.slice(0, 5).map(orderCard).join("");

    $("#admin-view").innerHTML = `
      <div class="stat-grid">
        <a class="stat-card" href="#/jerseys">
          <span class="stat-value">${products.length}</span>
          <span class="stat-label">Jerseys${outOfStock ? ` · ${outOfStock} Out of Stock` : ""}</span>
        </a>
        <a class="stat-card" href="#/categories">
          <span class="stat-value">${categories.length}</span>
          <span class="stat-label">Categories</span>
        </a>
        <a class="stat-card" href="#/orders">
          <span class="stat-value">${orders.length}</span>
          <span class="stat-label">${pending} Pending · ${paid} Paid</span>
        </a>
        <div class="stat-card">
          <span class="stat-value">${money(revenue)}</span>
          <span class="stat-label">Revenue (Excl. Cancelled)</span>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-head">
          <h2>Quick actions</h2>
        </div>
        <div class="quick-actions">
          <a href="#/jerseys/new" class="btn btn-primary btn-sm">+ Add Jersey</a>
          <a href="#/categories" class="btn btn-secondary btn-sm">Manage categories</a>
          <a href="#/settings" class="btn btn-secondary btn-sm">WhatsApp &amp; store settings</a>
          <a href="index.html" class="btn btn-ghost btn-sm">View store →</a>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-head">
          <h2>Recent orders</h2>
          <a href="#/orders" class="btn btn-ghost btn-sm">View all →</a>
        </div>
        ${
          recent ||
          '<p class="text-muted empty-line">No orders yet. Orders appear here when customers check out on WhatsApp.</p>'
        }
      </div>`;
  }

  /* ---------- jerseys list ---------- */

  let jerseySearch = "";

  function renderJerseys() {
    const q = jerseySearch.toLowerCase();
    const list = Store.products.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.club || "").toLowerCase().includes(q) ||
        (p.league || "").toLowerCase().includes(q)
    );

    const rows = list
      .map((p) => {
        const thumb = (p.images && p.images[0]) || p.image || "";
        return `
        <tr>
          <td class="cell-img"><img src="${esc(thumb)}" alt=""></td>
          <td>
            <div class="cell-title">${esc(p.name)}</div>
            <div class="cell-sub">${esc(p.club || "—")} · ${esc(p.league || "—")}</div>
          </td>
          <td><span class="pill">${esc(p.category || "none")}</span></td>
          <td class="cell-price">${money(p.price)}</td>
          <td>${p.badge ? `<span class="badge-pill">${esc(p.badge)}</span>` : '<span class="text-muted">—</span>'}</td>
          <td>
            <button type="button" class="stock-toggle ${p.in_stock ? "on" : "off"}" data-stock="${p.id}">
              ${p.in_stock ? "In stock" : "Out of stock"}
            </button>
          </td>
          <td class="cell-actions">
            <a class="btn btn-secondary btn-sm" href="#/jerseys/${p.id}">Edit</a>
            <button type="button" class="btn btn-ghost btn-sm danger" data-delete="${p.id}">Delete</button>
          </td>
        </tr>`;
      })
      .join("");

    $("#admin-view").innerHTML = `
      <div class="admin-toolbar">
        <input class="admin-search" id="jersey-search" type="search" placeholder="Search name, club, league…" value="${esc(jerseySearch)}">
        <a href="#/jerseys/new" class="btn btn-primary btn-sm">+ Add Jersey</a>
      </div>

      <div class="admin-card no-pad">
        ${
          list.length
            ? `<div class="table-scroll"><table class="admin-table jerseys-table">
                <thead><tr><th></th><th>Jersey</th><th>Category</th><th>Price</th><th>Badge</th><th>Stock</th><th></th></tr></thead>
                <tbody>${rows}</tbody></table></div>`
            : `<p class="text-muted empty-line">${Store.products.length ? "No jerseys match your search." : "No jerseys yet — add your first one."}</p>`
        }
      </div>`;

    const search = $("#jersey-search");
    search.addEventListener("input", () => {
      jerseySearch = search.value;
      const pos = search.selectionStart;
      renderJerseys();
      const next = $("#jersey-search");
      next.focus();
      next.setSelectionRange(pos, pos);
    });

    $$("[data-stock]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        try {
          await Store.toggleStock(btn.dataset.stock);
          renderJerseys();
        } catch (e) {
          toast("Could not update stock");
        }
      })
    );

    $$("[data-delete]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const p = Store.products.find((x) => x.id === Number(btn.dataset.delete));
        if (!p) return;
        if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
        try {
          await Store.deleteProduct(p.id);
          toast("Jersey deleted");
          renderJerseys();
        } catch (e) {
          toast("Delete failed: " + (e.message || e));
        }
      })
    );
  }

  /* ---------- jersey form ---------- */

  let formImages = [];
  let formSizes = [];
  let formId = null;

  function categoryOptions(selected) {
    const opts = Store.categories.filter((c) => c.slug !== "all");
    return (
      `<option value="" ${!selected ? "selected" : ""}>No category</option>` +
      opts
        .map(
          (c) =>
            `<option value="${esc(c.slug)}" ${selected === c.slug ? "selected" : ""}>${esc(c.name)}</option>`
        )
        .join("")
    );
  }

  function renderJerseyForm(param) {
    const isNew = !param || param === "new";
    const product = isNew ? null : Store.products.find((p) => p.id === Number(param));
    if (!isNew && !product) {
      $("#admin-view").innerHTML = `
        <div class="admin-card"><p>Jersey not found.</p>
        <a href="#/jerseys" class="btn btn-secondary btn-sm">Back to jerseys</a></div>`;
      return;
    }

    formId = product ? product.id : null;
    formImages = product ? ((product.images && product.images.length ? product.images : [product.image]).filter(Boolean)) : [];
    formSizes = product ? product.sizes.slice() : ["M", "L", "XL"];

    $("#admin-view").innerHTML = `
      <div class="admin-form-layout">
        <form id="jersey-form" class="admin-card admin-form" novalidate>
          <div class="form-section">
            <h3>Basics</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Title *</label>
                <input name="name" required placeholder="e.g. Manchester United 09/10 Home" value="${esc(product ? product.name : "")}">
              </div>
              <div class="form-group">
                <label>Club / Team</label>
                <input name="club" placeholder="e.g. Manchester United" value="${esc(product ? product.club : "")}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>League</label>
                <input name="league" list="league-list" placeholder="e.g. Premier League" value="${esc(product ? product.league : "")}">
                <datalist id="league-list">
                  <option value="Premier League"><option value="La Liga"><option value="Serie A">
                  <option value="Bundesliga"><option value="Ligue 1"><option value="International">
                </datalist>
              </div>
              <div class="form-group">
                <label>Category (filter option)</label>
                <select name="category">${categoryOptions(product ? product.category : "")}</select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Price (₦) *</label>
                <input name="price" type="number" min="0" step="500" required placeholder="85000" value="${product ? product.price : ""}">
              </div>
              <div class="form-group">
                <label>Badge</label>
                <input name="badge" list="badge-list" placeholder="None" value="${esc(product ? product.badge : "")}">
                <datalist id="badge-list">
                  <option value="Retro"><option value="Classic"><option value="Limited">
                </datalist>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Sizes &amp; availability</h3>
            <div class="form-group">
              <label>Sizes (click to toggle)</label>
              <div class="size-chips" id="size-chips">${sizeChipsHtml()}</div>
              <div class="chip-add">
                <input id="custom-size" placeholder="Custom size (e.g. 2XL)">
                <button type="button" class="btn btn-secondary btn-sm" id="add-size">Add size</button>
              </div>
            </div>
            <div class="toggle-row">
              <label class="toggle">
                <input type="checkbox" name="in_stock" ${!product || product.in_stock !== false ? "checked" : ""}>
                <span>In stock (shown as available)</span>
              </label>
              <label class="toggle">
                <input type="checkbox" name="featured" ${product && product.featured ? "checked" : ""}>
                <span>Featured (shows in “New Arrivals”)</span>
              </label>
            </div>
          </div>

          <div class="form-section">
            <h3>Description</h3>
            <div class="form-group">
              <label>Everything shown on the product page</label>
              <textarea name="description" rows="5" placeholder="History, sponsor, season details, condition…">${esc(product ? product.description : "")}</textarea>
            </div>
          </div>

          <div class="form-section">
            <h3>Images</h3>
            <p class="field-hint">First image is the cover used on listings. ${
              Store.storageEnabled()
                ? "Upload files or paste URLs."
                : "Supabase not configured — paste image URLs for now."
            }</p>
            <div class="image-actions">
              <label class="btn btn-secondary btn-sm file-btn ${Store.storageEnabled() ? "" : "disabled"}">
                Upload images
                <input type="file" id="image-files" accept="image/*" multiple ${Store.storageEnabled() ? "" : "disabled"}>
              </label>
              <div class="url-add">
                <input id="image-url" type="url" placeholder="https://…/jersey.jpg">
                <button type="button" class="btn btn-secondary btn-sm" id="add-url">Add URL</button>
              </div>
            </div>
            <div class="image-grid" id="image-grid">${imageGridHtml()}</div>
          </div>

          <div class="admin-form-actions">
            <button type="submit" class="btn btn-primary">${product ? "Save changes" : "Add jersey"}</button>
            <a href="#/jerseys" class="btn btn-ghost">Cancel</a>
            ${
              product
                ? '<button type="button" class="btn btn-ghost danger" id="delete-form" style="margin-left:auto">Delete jersey</button>'
                : ""
            }
          </div>
        </form>

        <aside class="admin-preview">
          <h4>Live preview</h4>
          <div id="preview-slot"></div>
        </aside>
      </div>`;

    updatePreview();
    wireJerseyForm(isNew, product);
    wireSizeChips();
  }

  function sizeChipsHtml() {
    const all = SIZE_CHIPS.slice();
    formSizes.forEach((s) => { if (!all.includes(s)) all.push(s); });
    return all
      .map(
        (s) =>
          `<button type="button" class="size-chip ${formSizes.includes(s) ? "on" : ""}" data-size="${esc(s)}">${esc(s)}</button>`
      )
      .join("");
  }

  function imageGridHtml() {
    if (!formImages.length) {
      return '<p class="text-muted empty-line" style="grid-column:1/-1">No images yet.</p>';
    }
    return formImages
      .map(
        (src, i) => `
        <div class="image-tile ${i === 0 ? "cover" : ""}">
          <img src="${esc(src)}" alt="">
          ${i === 0 ? '<span class="cover-tag">Cover</span>' : ""}
          <div class="image-tile-actions">
            ${i > 0 ? `<button type="button" data-cover="${i}" title="Make cover">★</button>` : ""}
            <button type="button" data-remove="${i}" title="Remove">✕</button>
          </div>
        </div>`
      )
      .join("");
  }

  function readJerseyForm() {
    const form = $("#jersey-form");
    return {
      id: formId,
      name: fld(form, "name").value.trim(),
      club: fld(form, "club").value.trim(),
      league: fld(form, "league").value.trim(),
      category: fld(form, "category").value,
      price: Number(fld(form, "price").value),
      badge: fld(form, "badge").value.trim(),
      description: fld(form, "description").value.trim(),
      featured: fld(form, "featured").checked,
      in_stock: fld(form, "in_stock").checked,
      sizes: formSizes.length ? formSizes.slice() : ["M"],
      images: formImages.slice(),
      image: formImages[0] || ""
    };
  }

  function updatePreview() {
    const slot = $("#preview-slot");
    if (!slot) return;
    const p = readJerseyForm();
    const cover = p.image;
    slot.innerHTML = `
      <article class="product-card admin-preview-card">
        <div class="product-image">
          ${p.badge ? `<span class="product-badge">${esc(p.badge)}</span>` : ""}
          ${cover ? `<img src="${esc(cover)}" alt="">` : '<div class="img-placeholder">No image</div>'}
        </div>
        <div class="product-info">
          <div class="product-club">${esc(p.club || "CLUB")}</div>
          <div class="product-name">${esc(p.name || "Jersey title")}</div>
          <div class="product-price">${money(p.price || 0)}</div>
        </div>
      </article>
      <div class="admin-preview-detail">
        <div class="product-club">${esc(p.club || "Club")} · ${esc(p.league || "League")}</div>
        <h3>${esc(p.name || "Jersey title")}</h3>
        <div class="product-price">${money(p.price || 0)}</div>
        <p class="text-muted">${esc(p.description || "Description will appear here.")}</p>
        <div class="size-options">${p.sizes.map((s) => `<span class="size-btn">${esc(s)}</span>`).join("")}</div>
        <div class="preview-state">${p.in_stock ? "In stock" : "Out of stock"}${p.featured ? " · Featured" : ""}</div>
      </div>`;
  }

  function refreshImages() {
    $("#image-grid").innerHTML = imageGridHtml();
    bindImageTiles();
    updatePreview();
  }

  function bindImageTiles() {
    $$("[data-remove]", $("#image-grid")).forEach((btn) =>
      btn.addEventListener("click", () => {
        formImages.splice(Number(btn.dataset.remove), 1);
        refreshImages();
      })
    );
    $$("[data-cover]", $("#image-grid")).forEach((btn) =>
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.cover);
        const [src] = formImages.splice(i, 1);
        formImages.unshift(src);
        refreshImages();
        toast("Cover updated");
      })
    );
  }

  function wireSizeChips() {
    $$(".size-chip", $("#size-chips")).forEach((chip) => {
      chip.onclick = () => {
        const size = chip.dataset.size;
        if (formSizes.includes(size)) formSizes = formSizes.filter((s) => s !== size);
        else formSizes.push(size);
        $("#size-chips").innerHTML = sizeChipsHtml();
        wireSizeChips();
        updatePreview();
      };
    });

    $("#add-size").onclick = () => {
      const input = $("#custom-size");
      const value = input.value.trim().toUpperCase();
      if (!value) return;
      if (!formSizes.includes(value)) formSizes.push(value);
      input.value = "";
      $("#size-chips").innerHTML = sizeChipsHtml();
      wireSizeChips();
      updatePreview();
    };

    $("#custom-size").onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        $("#add-size").click();
      }
    };
  }

  function wireJerseyForm(isNew, product) {
    const form = $("#jersey-form");

    $("#add-url").addEventListener("click", () => {
      const input = $("#image-url");
      const url = input.value.trim();
      if (!url) return;
      formImages.push(url);
      input.value = "";
      refreshImages();
    });

    $("#image-files").addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      e.target.value = "";
      if (!files.length) return;
      if (!Store.storageEnabled()) {
        toast("Uploads need Supabase — add keys in js/config.js (or paste URLs)");
        return;
      }
      for (const file of files) {
        try {
          toast("Uploading " + file.name + "…");
          const url = await Store.uploadImage(file, "jerseys");
          formImages.push(url);
          refreshImages();
        } catch (err) {
          toast("Upload failed: " + (err.message || err));
        }
      }
      toast("Upload done");
    });

    form.addEventListener("input", updatePreview);
    form.addEventListener("change", updatePreview);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const p = readJerseyForm();
      if (!p.name) return toast("Title is required");
      if (!p.price || p.price <= 0) return toast("Enter a valid price");
      if (!p.images.length) {
        if (!confirm("No image added. Save anyway?")) return;
      }
      try {
        await Store.saveProduct(p);
        toast(isNew ? "Jersey added" : "Changes saved");
        location.hash = "#/jerseys";
      } catch (err) {
        toast("Save failed: " + (err.message || err));
      }
    });

    const del = $("#delete-form");
    if (del) {
      del.addEventListener("click", async () => {
        if (!confirm(`Delete "${product.name}"?`)) return;
        try {
          await Store.deleteProduct(product.id);
          toast("Jersey deleted");
          location.hash = "#/jerseys";
        } catch (err) {
          toast("Delete failed: " + (err.message || err));
        }
      });
    }

    bindImageTiles();
  }

  /* ---------- categories ---------- */

  let editingCategory = null; // null = new

  function renderCategories() {
    const rows = Store.categories
      .map((c) => {
        const count = Store.products.filter((p) => p.category === c.slug).length;
        const isEditing = editingCategory && editingCategory.id === c.id;
        return `
        <tr class="${isEditing ? "row-editing" : ""}">
          <td class="cell-img cell-icon">${c.icon || "—"}</td>
          <td><div class="cell-title">${esc(c.name)}</div><div class="cell-sub">${esc(c.slug)} · ${count} jersey(s)</div></td>
          <td>${c.slug === "all" ? '<span class="text-muted">fixed</span>' : c.order}</td>
          <td class="cell-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-edit="${c.id}">Edit</button>
            <button type="button" class="btn btn-ghost btn-sm danger" data-del-cat="${c.id}" ${c.slug === "all" ? "disabled" : ""}>Delete</button>
          </td>
        </tr>`;
      })
      .join("");

    const editing = editingCategory || { name: "", slug: "", icon: "", order: Store.categories.length };
    const isNewCat = !editingCategory;

    $("#admin-view").innerHTML = `
      <div class="admin-split">
        <div class="admin-card no-pad">
          <div class="table-scroll">
            <table class="admin-table">
              <thead><tr><th></th><th>Option</th><th>Order</th><th></th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>

        <div class="admin-card admin-form">
          <div class="admin-card-head">
            <h2>${isNewCat ? "Add category" : "Edit category"}</h2>
          </div>
          <form id="category-form" novalidate>
            <div class="form-group">
              <label>Name *</label>
              <input name="name" required placeholder="e.g. Premier League" value="${esc(editing.name)}">
            </div>
            <div class="form-group">
              <label>Slug (used in URLs &amp; filters)</label>
              <input name="slug" placeholder="auto from name" value="${esc(editing.slug)}">
            </div>
            <div class="form-group">
              <label>Sort order</label>
              <input name="order" type="number" min="0" step="1" value="${Number(editing.order) || 0}">
            </div>
            <div class="form-group">
              <label>Icon (SVG)</label>
              <div class="icon-presets">
                ${ICON_PRESETS.map(
                  (p) => `<button type="button" class="icon-preset" data-svg="${esc(p.svg)}" title="${p.label}">${p.svg}</button>`
                ).join("")}
              </div>
              <textarea name="icon" rows="3" placeholder="<svg viewBox='0 0 24 24'>…</svg>">${esc(editing.icon)}</textarea>
            </div>
            <div class="admin-form-actions">
              <button type="submit" class="btn btn-primary btn-sm">${isNewCat ? "Add category" : "Save"}</button>
              <button type="button" class="btn btn-ghost btn-sm" id="cancel-cat">Clear</button>
            </div>
          </form>
        </div>
      </div>`;

    const form = $("#category-form");
    const nameInput = fld(form, "name");
    const slugInput = fld(form, "slug");
    const iconInput = fld(form, "icon");
    const orderInput = fld(form, "order");

    nameInput.addEventListener("input", () => {
      if (isNewCat || !slugInput.dataset.touched) {
        slugInput.value = slugify(nameInput.value);
      }
    });
    slugInput.addEventListener("input", () => { slugInput.dataset.touched = "1"; });

    $$(".icon-preset").forEach((btn) =>
      btn.addEventListener("click", () => {
        iconInput.value = btn.dataset.svg;
        $$(".icon-preset").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      })
    );

    $("#cancel-cat").addEventListener("click", () => {
      editingCategory = null;
      renderCategories();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const slug = slugify(slugInput.value || name);
      if (!name) return toast("Name is required");
      if (!slug) return toast("Slug is required");
      const clash = Store.categories.find((c) => c.slug === slug && (!editingCategory || c.id !== editingCategory.id));
      if (clash) return toast("That slug is already used");
      try {
        await Store.saveCategory({
          id: editingCategory ? editingCategory.id : null,
          name,
          slug,
          icon: iconInput.value.trim(),
          order: Number(orderInput.value) || 0
        });
        toast(editingCategory ? "Category saved" : "Category added");
        editingCategory = null;
        renderCategories();
      } catch (err) {
        toast("Save failed: " + (err.message || err));
      }
    });

    $$("[data-edit]").forEach((btn) =>
      btn.addEventListener("click", () => {
        editingCategory = Store.categories.find((c) => c.id === Number(btn.dataset.edit));
        renderCategories();
        const f = $("#category-form");
        if (f) fld(f, "name").focus();
      })
    );

    $$("[data-del-cat]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const cat = Store.categories.find((c) => c.id === Number(btn.dataset.delCat));
        if (!cat) return;
        const used = Store.products.filter((p) => p.category === cat.slug).length;
        const warn = used ? ` "${cat.slug}" is used by ${used} jersey(s) — they will be uncategorised.` : "";
        if (!confirm(`Delete category "${cat.name}"?` + warn)) return;
        try {
          await Store.deleteCategory(cat.id);
          if (editingCategory && editingCategory.id === cat.id) editingCategory = null;
          toast("Category deleted");
          renderCategories();
        } catch (err) {
          toast("Delete failed: " + (err.message || err));
        }
      })
    );
  }

  /* ---------- orders ---------- */

  let orderFilter = "all";
  let payFilter = "all";

  const PAY_LABELS = { paid: "Paid", unpaid: "Unpaid", failed: "Failed", refunded: "Refunded" };

  function orderCard(o) {
    const items = (o.items || [])
      .map((it) => {
        const customParts = it.custom
          ? [
              it.custom.name ? "Name: " + esc(it.custom.name) : "",
              it.custom.number ? "No.: " + esc(it.custom.number) : ""
            ].filter(Boolean)
          : [];
        const custom = customParts.length
          ? `<small class="order-custom">${customParts.join(" · ")}</small>`
          : "";
        return `<div class="order-line"><span>${esc(it.name)} <span class="text-muted">· size ${esc(it.size)} × ${it.quantity}</span>${custom}</span><span>${money((it.price || 0) * (it.quantity || 0))}</span></div>`;
      })
      .join("");
    const pay = o.payment_status || "unpaid";
    const payMeta = [displayLabel(o.payment_channel), o.payment_reference].filter(Boolean).join(" · ");
    const shipping = [o.phone, o.address, o.city].filter(Boolean).join(" · ");
    return `
      <div class="order-card" data-order="${o.id}">
        <div class="order-head">
          <div>
            <strong>#${o.id}</strong>
            <span class="text-muted"> · ${when(o.created_at)}</span>
            <div class="cell-sub">${esc(o.customer_name || "Guest")}${o.customer_email ? " · " + esc(o.customer_email) : ""}</div>
            ${shipping ? `<div class="cell-sub">${esc(shipping)}</div>` : ""}
          </div>
          <div class="order-total">
            ${money(o.total)}
            <span class="pay-badge ${esc(pay)}">${displayLabel(PAY_LABELS[pay] || pay)}</span>
            ${payMeta ? `<div class="cell-sub">${esc(payMeta)}</div>` : ""}
          </div>
        </div>
        <div class="order-items">${items || '<span class="text-muted">No items recorded</span>'}</div>
        ${o.note ? `<div class="order-note text-muted">Note: ${esc(o.note)}</div>` : ""}
        <div class="order-foot">
          <select class="sort-select" data-status="${o.id}">
            ${["pending", "confirmed", "shipped", "delivered", "cancelled"]
              .map((s) => `<option value="${s}" ${o.status === s ? "selected" : ""}>${displayLabel(s)}</option>`)
              .join("")}
          </select>
          <select class="sort-select" data-pay-status="${o.id}">
            ${["unpaid", "paid", "failed", "refunded"]
              .map((s) => `<option value="${s}" ${pay === s ? "selected" : ""}>${displayLabel(PAY_LABELS[s] || s)}</option>`)
              .join("")}
          </select>
          <button type="button" class="btn btn-ghost btn-sm danger" data-del-order="${o.id}">Delete</button>
        </div>
      </div>`;
  }

  function renderOrders() {
    let orders = orderFilter === "all" ? Store.orders : Store.orders.filter((o) => o.status === orderFilter);
    if (payFilter !== "all") orders = orders.filter((o) => (o.payment_status || "unpaid") === payFilter);

    $("#admin-view").innerHTML = `
      <div class="admin-toolbar orders-toolbar">
        <select class="sort-select" id="order-filter">
          ${["all", "pending", "confirmed", "shipped", "delivered", "cancelled"]
            .map((s) => `<option value="${s}" ${orderFilter === s ? "selected" : ""}>${s === "all" ? "All Statuses" : displayLabel(s)}</option>`)
            .join("")}
        </select>
        <select class="sort-select" id="pay-filter">
          ${["all", "unpaid", "paid", "failed", "refunded"]
            .map((s) => `<option value="${s}" ${payFilter === s ? "selected" : ""}>${s === "all" ? "All Payments" : displayLabel(PAY_LABELS[s] || s)}</option>`)
            .join("")}
        </select>
        <button type="button" class="btn btn-secondary btn-sm" id="refresh-orders">Refresh</button>
      </div>
      <div class="order-list">
        ${
          orders.length
            ? orders.map(orderCard).join("")
            : '<div class="admin-card"><p class="text-muted empty-line">No orders match this filter.</p></div>'
        }
      </div>`;

    $("#order-filter").addEventListener("change", (e) => {
      orderFilter = e.target.value;
      renderOrders();
    });

    $("#pay-filter").addEventListener("change", (e) => {
      payFilter = e.target.value;
      renderOrders();
    });

    $("#refresh-orders").addEventListener("click", async () => {
      await Store.getOrders();
      renderOrders();
      toast("Orders refreshed");
    });

    $$("[data-status]").forEach((sel) =>
      sel.addEventListener("change", async () => {
        try {
          await Store.updateOrder(sel.dataset.status, { status: sel.value });
          toast("Order #" + sel.dataset.status + " → " + displayLabel(sel.value));
        } catch (e) {
          toast("Update failed");
        }
      })
    );

    $$("[data-pay-status]").forEach((sel) =>
      sel.addEventListener("change", async () => {
        try {
          await Store.updateOrder(sel.dataset.payStatus, { payment_status: sel.value });
          toast("Payment #" + sel.dataset.payStatus + " → " + displayLabel(sel.value));
        } catch (e) {
          toast("Update failed");
        }
      })
    );

    $$("[data-del-order]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Delete order #" + btn.dataset.delOrder + "?")) return;
        try {
          await Store.deleteOrder(btn.dataset.delOrder);
          toast("Order deleted");
          renderOrders();
        } catch (e) {
          toast("Delete failed");
        }
      })
    );
  }

  /* ---------- settings ---------- */

  function renderSettings() {
    const s = Store.settings;
    $("#admin-view").innerHTML = `
      <form id="settings-form" class="admin-card admin-form" novalidate>
        <div class="admin-card-head"><h2>WhatsApp</h2></div>
        <div class="form-group">
          <label>WhatsApp number (country code, digits only)</label>
          <input name="whatsapp_number" inputmode="tel" placeholder="2348012345678" value="${esc(s.whatsapp_number || "")}">
          <p class="field-hint">Nigeria example: 2348012345678 — no “+”, spaces or dashes. Used by the cart checkout and every “Order on WhatsApp” button.</p>
          <p class="field-hint">Current link: <a id="wa-preview" href="https://wa.me/${esc(String(s.whatsapp_number || ""))}" target="_blank" rel="noopener">${esc("wa.me/" + String(s.whatsapp_number || ""))}</a></p>
        </div>
        <div class="form-group">
          <label>Order message intro (optional)</label>
          <textarea name="whatsapp_prefill" rows="2" placeholder="Hi N-KITS, I want to place an order:">${esc(s.whatsapp_prefill || "")}</textarea>
          <p class="field-hint">Opening line of the pre-filled message. Leave empty for the default.</p>
        </div>

        <div class="admin-card-head"><h2>Store details</h2></div>
        <div class="form-row">
          <div class="form-group">
            <label>Store name</label>
            <input name="store_name" placeholder="N-KITS" value="${esc(s.store_name || "N-KITS")}">
          </div>
          <div class="form-group">
            <label>Contact email</label>
            <input name="contact_email" type="email" placeholder="orders@n-kits.ng" value="${esc(s.contact_email || "")}">
          </div>
        </div>
        <div class="form-group">
          <label>Instagram handle</label>
          <input name="instagram" placeholder="@n-kits" value="${esc(s.instagram || "")}">
        </div>

        <div class="admin-card-head"><h2>Customization</h2></div>
        <div class="form-group">
          <label>Customization fee per jersey (₦)</label>
          <input name="customization_fee" inputmode="numeric" placeholder="3000" value="${esc(s.customization_fee || "3000")}">
          <p class="field-hint">Charged once for each jersey with a customization selected.</p>
        </div>

        <div class="admin-form-actions">
          <button type="submit" class="btn btn-primary">Save settings</button>
        </div>

        <p class="field-hint">Storage bucket for uploads: <code>${esc(SUPABASE_STORAGE_BUCKET)}</code> ${
          Store.storageEnabled() ? "· connected" : "· not connected (add Supabase keys)"
        }</p>
      </form>`;

    const form = $("#settings-form");
    const waInput = fld(form, "whatsapp_number");
    waInput.addEventListener("input", () => {
      const digitsOnly = waInput.value.replace(/\D/g, "");
      $("#wa-preview").textContent = "wa.me/" + digitsOnly;
      $("#wa-preview").href = "https://wa.me/" + digitsOnly;
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await Store.saveSettings({
          whatsapp_number: waInput.value.replace(/\D/g, ""),
          whatsapp_prefill: fld(form, "whatsapp_prefill").value.trim(),
          store_name: fld(form, "store_name").value.trim(),
          contact_email: fld(form, "contact_email").value.trim(),
          instagram: fld(form, "instagram").value.trim(),
          customization_fee: fld(form, "customization_fee").value.replace(/\D/g, "") || "3000"
        });
        toast("Settings saved");
      } catch (err) {
        toast("Save failed: " + (err.message || err));
      }
    });
  }

  /* ---------- boot ---------- */

  async function boot() {
    await Store.ready();
    await authReady();
    mode = Store.supabase() ? "supabase" : "local";

    if (await hasAccess()) startApp();
    else showAuthCard();

    $("#admin-logout-btn").addEventListener("click", adminLogout);
    $("#admin-menu-btn").addEventListener("click", () => $("#admin-sidebar").classList.toggle("open"));
    window.addEventListener("hashchange", route);
  }

  // Wire the Sign in form immediately (before the async boot) so a slow or failed
  // boot can never leave a dead button that submits natively and reloads the page.
  // Also apply the local-mode group state right away: the raw HTML starts with
  // email/password visible and required, which would block a quick first click.
  loginWired = true;
  $("#admin-login-form").addEventListener("submit", onLoginSubmit);
  showAuthCard();

  boot().catch((err) => {
    // Never leave a dead sign-in button: show WHY the panel failed to start.
    console.error("Admin boot failed:", err);
    mode = "local";
    try {
      showAuthCard(
        "Admin panel failed to start: " +
        (err && err.message ? err.message : err) +
        " — see the console (F12). Usually a stale cache or js/config.js failing to load."
      );
    } catch (x) {
      console.error(x);
    }
  });
})();
