/* ============================================
   N-KITS – Data layer (Supabase + local fallback)
   ============================================
   Single source of truth for products, categories,
   settings and orders. Reads from Supabase when
   js/config.js has real keys, otherwise from
   localStorage seeded with the defaults in data.js.
   ============================================ */

function displayLabel(value) {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
    .replace(/\bWhatsapp\b/g, "WhatsApp");
}

const Store = (() => {
  const LS = {
    products: "retrokit_products",
    categories: "retrokit_categories",
    settings: "retrokit_settings",
    orders: "retrokit_orders"
  };

  const state = {
    products: [],
    categories: [],
    settings: {},
    orders: [],
    remote: false,
    loaded: false
  };

  let client;
  let loadPromise = null;

  /* ---------- helpers ---------- */

  const readLS = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeLS = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  };

  const nextId = (rows) =>
    rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;

  const digits = (s) => String(s || "").replace(/\D/g, "");

  function getClient() {
    if (client !== undefined) return client;
    client = null;
    if (
      typeof isSupabaseConfigured === "function" &&
      isSupabaseConfigured() &&
      typeof window.supabase !== "undefined" &&
      typeof window.supabase.createClient === "function"
    ) {
      try {
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } catch (e) {
        console.warn("Supabase client failed to start", e);
        client = null;
      }
    }
    return client;
  }

  function syncGlobals() {
    if (typeof PRODUCTS !== "undefined") PRODUCTS = state.products;
    if (typeof CATEGORIES !== "undefined") CATEGORIES = state.categories;
  }

  const DEFAULT_SETTINGS = () => ({
    store_name: "N-KITS",
    whatsapp_number: typeof DEFAULT_WHATSAPP_NUMBER === "string" ? DEFAULT_WHATSAPP_NUMBER : "",
    whatsapp_prefill: "",
    contact_email: "",
    instagram: "",
    customization_fee: "3000"
  });

  /* ---------- row <-> js mapping ---------- */

  function rowToProduct(row, slugById) {
    const images = Array.isArray(row.images) ? row.images.slice() : [];
    const image = images[0] || row.image || "";
    if (image && images[0] !== image) images.unshift(image);
    return {
      id: Number(row.id),
      name: row.name || "",
      club: row.club || "",
      league: row.league || "",
      category: row.category || "",
      price: Number(row.price) || 0,
      badge: row.badge || "",
      image,
      images,
      description: row.description || "",
      sizes: Array.isArray(row.sizes) && row.sizes.length ? row.sizes.slice() : ["M", "L", "XL"],
      featured: Boolean(row.featured),
      in_stock: row.in_stock !== false
    };
  }

  function productToRow(p) {
    const images = (p.images && p.images.length ? p.images : [p.image]).filter(Boolean);
    return {
      name: p.name,
      club: p.club,
      league: p.league,
      category: p.category || null,
      price: Math.round(Number(p.price) || 0),
      badge: p.badge || null,
      images,
      description: p.description || "",
      sizes: p.sizes && p.sizes.length ? p.sizes : ["M", "L", "XL"],
      featured: Boolean(p.featured),
      in_stock: p.in_stock !== false
    };
  }

  function rowToCategory(row) {
    return {
      id: Number(row.id),
      slug: row.slug,
      name: row.name,
      icon: row.icon || "",
      order: Number(row.sort_order) || 0
    };
  }

  function rowToOrder(row) {
    return {
      id: Number(row.id),
      customer_name: row.customer_name || "",
      customer_email: row.customer_email || "",
      user_id: row.user_id || null,
      phone: row.phone || "",
      address: row.address || "",
      city: row.city || "",
      items: Array.isArray(row.items) ? row.items : [],
      total: Number(row.total) || 0,
      status: row.status || "pending",
      payment_status: row.payment_status || "unpaid",
      payment_reference: row.payment_reference || "",
      payment_channel: row.payment_channel || "",
      paid_at: row.paid_at || null,
      note: row.note || "",
      created_at: row.created_at
    };
  }

  /* ---------- local mode ---------- */

  function loadLocal() {
    const seededCategories =
      readLS(LS.categories, null) ||
      (typeof CATEGORIES !== "undefined"
        ? CATEGORIES.map((c, i) => ({ id: i + 1, slug: c.id, name: c.name, icon: c.icon, order: i }))
        : []);

    const seededProducts =
      readLS(LS.products, null) ||
      (typeof PRODUCTS !== "undefined"
        ? PRODUCTS.map((p) => ({ ...p, images: p.images && p.images.length ? p.images : [p.image], featured: Boolean(p.featured), in_stock: p.in_stock !== false }))
        : []);

    state.categories = seededCategories;
    state.products = seededProducts;
    state.settings = { ...DEFAULT_SETTINGS(), ...readLS(LS.settings, {}) };
    state.orders = readLS(LS.orders, []);
    state.remote = false;
    persistLocal();
  }

  function persistLocal() {
    writeLS(LS.products, state.products);
    writeLS(LS.categories, state.categories);
    writeLS(LS.settings, state.settings);
    writeLS(LS.orders, state.orders);
  }

  /* ---------- remote mode ---------- */

  async function loadRemote(sb) {
    const [{ data: cats, error: catErr }, { data: prods, error: prodErr }, { data: sets, error: setErr }, { data: ords, error: ordErr }] =
      await Promise.all([
        sb.from("categories").select("*").order("sort_order", { ascending: true }),
        sb.from("products").select("*").order("created_at", { ascending: false }),
        sb.from("settings").select("key, value"),
        sb.from("orders").select("*").order("created_at", { ascending: false }).limit(200)
      ]);

    if (catErr || prodErr) throw catErr || prodErr;

    const slugById = {};
    state.categories = (cats || []).map((r) => {
      const c = rowToCategory(r);
      slugById[c.id] = c.slug;
      return c;
    });

    state.products = (prods || []).map((r) => {
      const p = rowToProduct(r, slugById);
      if (p.category && /^\d+$/.test(p.category)) p.category = slugById[p.category] || "";
      return p;
    });

    state.settings = { ...DEFAULT_SETTINGS() };
    (sets || []).forEach((s) => { state.settings[s.key] = s.value; });

    state.orders = (ords || []).map(rowToOrder);

    state.remote = true;
    persistLocal();
  }

  /* ---------- load ---------- */

  async function load() {
    const sb = getClient();
    if (!sb) {
      loadLocal();
      return;
    }
    try {
      await loadRemote(sb);
    } catch (e) {
      console.warn("Supabase unavailable, using local data.", e && e.message);
      loadLocal();
    }
  }

  function ready() {
    if (!loadPromise) {
      loadPromise = load().then(() => {
        state.loaded = true;
        syncGlobals();
      });
    }
    return loadPromise;
  }

  /* ---------- products ---------- */

  async function saveProduct(product) {
    await ready();
    const isNew = !product.id;
    const payload = productToRow(product);

    if (state.remote) {
      let saved;
      if (isNew) {
        const { data, error } = await getClient().from("products").insert(payload).select().single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await getClient().from("products").update(payload).eq("id", product.id).select().single();
        if (error) throw error;
        saved = data;
      }
      const row = rowToProduct(saved);
      if (isNew) state.products.unshift(row);
      else state.products = state.products.map((p) => (p.id === row.id ? row : p));
    } else {
      if (isNew) {
        product = { ...product, id: nextId(state.products) };
        state.products.unshift(product);
      } else {
        state.products = state.products.map((p) => (p.id === Number(product.id) ? { ...p, ...product, id: Number(product.id) } : p));
      }
    }

    syncGlobals();
    writeLS(LS.products, state.products);
    return product;
  }

  async function deleteProduct(id) {
    await ready();
    id = Number(id);
    if (state.remote) {
      const { error } = await getClient().from("products").delete().eq("id", id);
      if (error) throw error;
    }
    state.products = state.products.filter((p) => p.id !== id);
    syncGlobals();
    writeLS(LS.products, state.products);
  }

  async function toggleStock(id) {
    const product = state.products.find((p) => p.id === Number(id));
    if (!product) return null;
    return saveProduct({ ...product, in_stock: !product.in_stock });
  }

  /* ---------- categories ---------- */

  async function saveCategory(category) {
    await ready();
    const isNew = !category.id;
    const payload = {
      slug: category.slug,
      name: category.name,
      icon: category.icon || "",
      sort_order: Number(category.order) || 0
    };

    if (state.remote) {
      let saved;
      if (isNew) {
        const { data, error } = await getClient().from("categories").insert(payload).select().single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await getClient().from("categories").update(payload).eq("id", category.id).select().single();
        if (error) throw error;
        saved = data;
      }
      const row = rowToCategory(saved);
      if (isNew) state.categories.push(row);
      else state.categories = state.categories.map((c) => (c.id === row.id ? row : c));
    } else {
      if (isNew) {
        category = { ...category, id: nextId(state.categories) };
        state.categories.push(category);
      } else {
        state.categories = state.categories.map((c) =>
          c.id === Number(category.id) ? { ...c, ...category, id: Number(category.id) } : c
        );
      }
    }

    state.categories.sort((a, b) => a.order - b.order);
    syncGlobals();
    writeLS(LS.categories, state.categories);
    return category;
  }

  async function deleteCategory(id) {
    await ready();
    id = Number(id);
    const category = state.categories.find((c) => c.id === id);
    if (!category) return;
    const used = state.products.filter((p) => p.category === category.slug);
    if (used.length) {
      for (const p of used) await saveProduct({ ...p, category: "" });
    }
    if (state.remote) {
      const { error } = await getClient().from("categories").delete().eq("id", id);
      if (error) throw error;
    }
    state.categories = state.categories.filter((c) => c.id !== id);
    syncGlobals();
    writeLS(LS.categories, state.categories);
  }

  /* ---------- settings ---------- */

  async function saveSettings(values) {
    await ready();
    const entries = Object.entries(values).filter(([, v]) => v !== undefined && v !== null);

    if (state.remote) {
      const rows = entries.map(([key, value]) => ({ key, value: String(value) }));
      const { error } = await getClient().from("settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    }

    entries.forEach(([key, value]) => { state.settings[key] = String(value); });
    writeLS(LS.settings, state.settings);
    return state.settings;
  }

  function getSetting(key) {
    return state.settings[key] != null ? state.settings[key] : "";
  }

  function getWhatsAppNumber() {
    return digits(getSetting("whatsapp_number")) ||
      (typeof DEFAULT_WHATSAPP_NUMBER === "string" ? DEFAULT_WHATSAPP_NUMBER : "");
  }

  function buildWhatsAppUrl(message) {
    return "https://wa.me/" + getWhatsAppNumber() + "?text=" + encodeURIComponent(message || "");
  }

  /* ---------- orders ---------- */

  async function createOrder(order) {
    await ready();
    const payload = {
      customer_name: order.customer_name || "",
      customer_email: order.customer_email || "",
      user_id: order.user_id || null,
      phone: order.phone || "",
      address: order.address || "",
      city: order.city || "",
      items: order.items || [],
      total: Math.round(Number(order.total) || 0),
      status: "pending",
      payment_status: order.payment_status || "unpaid",
      payment_reference: order.payment_reference || null,
      payment_channel: order.payment_channel || "",
      paid_at: order.paid_at || null,
      note: order.note || ""
    };

    if (state.remote) {
      try {
        const { data, error } = await getClient().from("orders").insert(payload).select().single();
        if (error) throw error;
        const row = rowToOrder(data);
        state.orders.unshift(row);
        writeLS(LS.orders, state.orders);
        return row.id;
      } catch (e) {
        console.warn("Order not saved to Supabase", e && e.message);
      }
    }

    const row = { ...payload, id: nextId(state.orders), created_at: new Date().toISOString() };
    state.orders.unshift(row);
    writeLS(LS.orders, state.orders);
    return row.id;
  }

  async function updateOrder(id, patch) {
    await ready();
    id = Number(id);
    if (state.remote) {
      const clean = {};
      if (patch.status !== undefined) clean.status = patch.status;
      if (patch.payment_status !== undefined) clean.payment_status = patch.payment_status;
      if (patch.note !== undefined) clean.note = patch.note;
      if (patch.customer_name !== undefined) clean.customer_name = patch.customer_name;
      const { error } = await getClient().from("orders").update(clean).eq("id", id);
      if (error) throw error;
    }
    state.orders = state.orders.map((o) => (o.id === id ? { ...o, ...patch, id } : o));
    writeLS(LS.orders, state.orders);
  }

  async function deleteOrder(id) {
    await ready();
    id = Number(id);
    if (state.remote) {
      const { error } = await getClient().from("orders").delete().eq("id", id);
      if (error) throw error;
    }
    state.orders = state.orders.filter((o) => o.id !== id);
    writeLS(LS.orders, state.orders);
  }

  async function getOrders() {
    await ready();
    if (state.remote) {
      try {
        const { data, error } = await getClient().from("orders").select("*").order("created_at", { ascending: false });
        if (!error && data) state.orders = data.map(rowToOrder);
      } catch (e) {}
    }
    return state.orders;
  }

  /* ---------- storage ---------- */

  async function uploadImage(file, folder) {
    const sb = getClient();
    if (!sb) throw new Error("Image upload needs Supabase storage — add your keys in js/config.js");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = (folder || "jerseys") + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    const { data, error } = await sb.storage.from(SUPABASE_STORAGE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined
    });
    if (error) throw error;
    const { data: pub } = sb.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(data.path);
    return pub.publicUrl;
  }

  function storageEnabled() {
    return Boolean(getClient());
  }

  return {
    ready,
    supabase: () => getClient(),
    get remote() { return state.remote; },
    get loaded() { return state.loaded; },
    get products() { return state.products; },
    get categories() { return state.categories; },
    get orders() { return state.orders; },
    get settings() { return state.settings; },
    saveProduct,
    deleteProduct,
    toggleStock,
    saveCategory,
    deleteCategory,
    saveSettings,
    getSetting,
    getWhatsAppNumber,
    buildWhatsAppUrl,
    createOrder,
    updateOrder,
    deleteOrder,
    getOrders,
    uploadImage,
    storageEnabled
  };
})();
