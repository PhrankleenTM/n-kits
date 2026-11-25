(function () {
  "use strict";

  const KEY = "retrokit_theme";
  const root = document.documentElement;
  const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function savedTheme() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function systemTheme() {
    return media && media.matches ? "dark" : "light";
  }

  function currentTheme() {
    const stored = savedTheme();
    return stored === "dark" || stored === "light" ? stored : systemTheme();
  }

  function apply(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const next = theme === "dark" ? "light" : "dark";
    const label = "Switch to " + next + " mode";
    const meta = document.querySelector('meta[name="theme-color"]');

    if (meta) meta.setAttribute("content", theme === "dark" ? "#171528" : "#f4f3f8");

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    });
  }

  apply(currentTheme());

  function initWhatsAppButton() {
    if (document.body.classList.contains("admin-body")) return;
    if (document.querySelector(".wa-fab")) return;

    const message = "Hi N-KITS, I have a question about a jersey.";
    const link = document.createElement("a");
    link.className = "wa-fab";
    link.setAttribute("aria-label", "Chat with N-KITS on WhatsApp");
    link.setAttribute("title", "Chat with us on WhatsApp");
    link.target = "_blank";
    link.rel = "noopener";
    link.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.04 2C8.3 2 2.04 8.26 2.04 16c0 2.47.65 4.88 1.88 7.01L2 30l7.14-1.87A13.94 13.94 0 0 0 16.04 30h.01C23.79 30 30.05 23.74 30.05 16S23.79 2 16.04 2zm0 25.46a11.9 11.9 0 0 1-6.07-1.66l-.43-.26-4.24 1.11 1.14-4.13-.28-.43a11.88 11.88 0 0 1-1.83-6.33c0-6.57 5.35-11.92 11.93-11.92 3.19 0 6.19 1.25 8.45 3.5a11.86 11.86 0 0 1 3.5 8.45c0 6.57-5.35 11.93-11.96 11.93zm6.55-8.93c-.36-.18-2.14-1.06-2.47-1.18-.33-.12-.57-.18-.81.18-.24.36-.93 1.18-1.14 1.42-.21.24-.42.27-.78.09-.36-.18-1.53-.56-2.92-1.8-1.08-.96-1.81-2.15-2.02-2.51-.21-.36-.02-.55.16-.73.16-.16.36-.42.54-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.29-.7-.59-.61-.81-.62h-.69c-.24 0-.63.09-.96.45-.33.36-1.27 1.24-1.27 3.02s1.3 3.5 1.48 3.74c.18.24 2.56 3.9 6.2 5.47.87.37 1.54.6 2.07.77.87.28 1.66.24 2.29.15.7-.11 2.14-.88 2.44-1.72.3-.85.3-1.57.21-1.72-.09-.15-.33-.24-.69-.42z"/></svg>';

    function setHref() {
      if (typeof Store !== "undefined" && typeof Store.buildWhatsAppUrl === "function") {
        link.href = Store.buildWhatsAppUrl(message);
      } else if (typeof DEFAULT_WHATSAPP_NUMBER === "string") {
        link.href = "https://wa.me/" + DEFAULT_WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
      } else {
        link.href = "https://wa.me/?text=" + encodeURIComponent(message);
      }
    }

    setHref();
    link.addEventListener("click", setHref);
    document.body.appendChild(link);

    if (typeof Store !== "undefined" && typeof Store.ready === "function") {
      Store.ready().then(setHref).catch(function () {});
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        const next = root.dataset.theme === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(KEY, next);
        } catch (e) {}
        apply(next);
      });
    });
    initWhatsAppButton();
  });

  if (media && media.addEventListener) {
    media.addEventListener("change", function () {
      if (!savedTheme()) apply(systemTheme());
    });
  }
})();
