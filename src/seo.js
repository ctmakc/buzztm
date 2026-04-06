function ensureMeta(attr, key) {
  let node = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attr, key);
    document.head.appendChild(node);
  }
  return node;
}

function ensureLink(rel, hreflang) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", rel);
    if (hreflang) node.setAttribute("hreflang", hreflang);
    document.head.appendChild(node);
  }
  return node;
}

function setAlternates(origin, pathname) {
  const base = `${origin}${pathname}`;
  [
    ["x-default", `${base}?lang=en`],
    ["en", `${base}?lang=en`],
    ["ru", `${base}?lang=ru`],
    ["uk", `${base}?lang=uk`]
  ].forEach(([lang, href]) => {
    ensureLink("alternate", lang).setAttribute("href", href);
  });
}

function setSchema({ locale, canonicalUrl }) {
  let node = document.head.querySelector('script[data-seo-schema="marketing-agency"]');
  if (!node) {
    node = document.createElement("script");
    node.type = "application/ld+json";
    node.dataset.seoSchema = "marketing-agency";
    document.head.appendChild(node);
  }

  node.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MarketingAgency",
    name: "Buzztm",
    url: canonicalUrl,
    description:
      "Editorial TikTok launch bursts for brands that need public-proof-driven reach in restricted or unstable markets.",
    sameAs: [
      "https://www.instagram.com/adactedagency/",
      "https://www.linkedin.com/company/73956025",
      "https://www.facebook.com/Adacted-102016908383521",
      "https://mmix.ua/en/nastrojka-reklamyi-v-tiktok/",
      "https://mmix.ua/ua/nalashtuvannya-reklami-v-tiktok/"
    ],
    areaServed: ["Europe", "CIS", "Global"],
    knowsLanguage:
      locale === "uk"
        ? ["English", "Ukrainian"]
        : locale === "ru"
          ? ["English", "Russian"]
          : ["English", "Russian", "Ukrainian"],
    serviceType: [
      "TikTok reach strategy",
      "Creator-style launch bursts",
      "Multilingual short-form campaign packaging"
    ]
  });
}

export function applySeo({ locale, seo }) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", locale);
  const canonicalUrl = url.toString();

  document.title = seo.title;
  document.documentElement.lang = locale;

  ensureMeta("name", "description").setAttribute("content", seo.description);
  ensureMeta("name", "robots").setAttribute("content", "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");
  ensureMeta("name", "theme-color").setAttribute("content", "#f2eee5");

  ensureMeta("property", "og:type").setAttribute("content", "website");
  ensureMeta("property", "og:locale").setAttribute("content", locale === "uk" ? "uk_UA" : locale === "ru" ? "ru_RU" : "en_US");
  ensureMeta("property", "og:title").setAttribute("content", seo.ogTitle);
  ensureMeta("property", "og:description").setAttribute("content", seo.ogDescription);
  ensureMeta("property", "og:url").setAttribute("content", canonicalUrl);

  ensureMeta("name", "twitter:card").setAttribute("content", "summary_large_image");
  ensureMeta("name", "twitter:title").setAttribute("content", seo.ogTitle);
  ensureMeta("name", "twitter:description").setAttribute("content", seo.ogDescription);

  ensureLink("canonical").setAttribute("href", canonicalUrl);
  setAlternates(url.origin, url.pathname || "/");
  setSchema({ locale, canonicalUrl });
}
