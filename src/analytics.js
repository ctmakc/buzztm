let initialized = false;

function loadScript(src, id) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  s.id = id;
  document.head.appendChild(s);
}

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

function pushDataLayerEvent(payload) {
  if (typeof window === "undefined") return;
  ensureDataLayer().push(payload);
}

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const gtmId = import.meta.env.VITE_GTM_ID;
  const gaId = import.meta.env.VITE_GA_ID;
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;

  if (gtmId) {
    ensureDataLayer();
    pushDataLayerEvent({
      "gtm.start": Date.now(),
      event: "gtm.js"
    });
    loadScript(
      `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`,
      "gtm-script"
    );
  }

  if (gaId && !gtmId) {
    ensureDataLayer();
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", gaId, { send_page_view: false });
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`, "ga4-script");
  }

  if (pixelId) {
    if (!window.fbq) {
      window.fbq = function fbqProxy() {
        (window.fbq.q = window.fbq.q || []).push(arguments);
      };
      window.fbq.loaded = true;
      window.fbq.version = "2.0";
    }
    loadScript("https://connect.facebook.net/en_US/fbevents.js", "meta-pixel-script");
    window.fbq("init", pixelId);
  }
}

export function trackPageView({ locale, page }) {
  if (window.dataLayer) {
    pushDataLayerEvent({
      event: "page_view",
      page_title: document.title,
      page_location: window.location.href,
      locale,
      page_name: page
    });
  }

  if (window.gtag && !import.meta.env.VITE_GTM_ID) {
    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      locale,
      page_name: page
    });
  }
  if (window.fbq) {
    window.fbq("track", "PageView");
  }
}

export function trackEvent(name, params = {}) {
  if (window.dataLayer) {
    pushDataLayerEvent({
      event: name,
      ...params
    });
  }

  if (window.gtag && !import.meta.env.VITE_GTM_ID) {
    window.gtag("event", name, params);
  }

  if (window.fbq) {
    if (name === "generate_lead") {
      window.fbq("track", "Lead", params);
    } else {
      window.fbq("trackCustom", name, params);
    }
  }
}
