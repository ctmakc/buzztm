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
    ["ru", `${base}?lang=ru`]
  ].forEach(([lang, href]) => {
    ensureLink("alternate", lang).setAttribute("href", href);
  });
}

function setAgencySchema({ locale, canonicalUrl, seo }) {
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
    description: seo.description,
    sameAs: [
      "https://www.instagram.com/adactedagency/",
      "https://www.linkedin.com/company/73956025",
      "https://www.facebook.com/Adacted-102016908383521",
      "https://mmix.ua/en/nastrojka-reklamyi-v-tiktok/",
      "https://mmix.ua/ua/nalashtuvannya-reklami-v-tiktok/"
    ],
    areaServed: ["Europe", "CIS", "GCC", "MENA"],
    knowsLanguage: locale === "ru" ? ["Russian", "English"] : ["English", "Russian"],
    serviceType: [
      "TikTok growth strategy",
      "UGC production",
      "Performance creative testing",
      "Landing localization",
      "Multi-geo launch rollout"
    ]
  });
}

function setFaqSchema(faq = []) {
  const existing = document.head.querySelector('script[data-seo-schema="faq-page"]');

  if (!faq.length) {
    if (existing) existing.remove();
    return;
  }

  let node = existing;
  if (!node) {
    node = document.createElement("script");
    node.type = "application/ld+json";
    node.dataset.seoSchema = "faq-page";
    document.head.appendChild(node);
  }

  node.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }))
  });
}

function setArticleSchema({ article, canonicalUrl }) {
  const existing = document.head.querySelector('script[data-seo-schema="article"]');

  if (!article) {
    if (existing) existing.remove();
    return;
  }

  let node = existing;
  if (!node) {
    node = document.createElement("script");
    node.type = "application/ld+json";
    node.dataset.seoSchema = "article";
    document.head.appendChild(node);
  }

  node.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.headline,
    description: article.description,
    datePublished: article.datePublished,
    dateModified: article.datePublished,
    inLanguage: article.inLanguage,
    mainEntityOfPage: canonicalUrl,
    author: {
      "@type": "Organization",
      name: "Buzztm"
    },
    publisher: {
      "@type": "Organization",
      name: "Buzztm"
    }
  });
}

export function applySeo({ locale, seo, faq, article }) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", locale);
  const canonicalUrl = url.toString();
  const ogType = article ? "article" : "website";

  document.title = seo.title;
  document.documentElement.lang = locale;

  ensureMeta("name", "description").setAttribute("content", seo.description);
  ensureMeta("name", "keywords").setAttribute("content", seo.keywords || "");
  ensureMeta("name", "robots").setAttribute(
    "content",
    "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
  );
  ensureMeta("name", "theme-color").setAttribute("content", "#081018");

  ensureMeta("property", "og:type").setAttribute("content", ogType);
  ensureMeta("property", "og:site_name").setAttribute("content", "Buzztm");
  ensureMeta("property", "og:locale").setAttribute("content", locale === "ru" ? "ru_RU" : "en_US");
  ensureMeta("property", "og:title").setAttribute("content", seo.ogTitle);
  ensureMeta("property", "og:description").setAttribute("content", seo.ogDescription);
  ensureMeta("property", "og:url").setAttribute("content", canonicalUrl);
  ensureMeta("property", "og:image").setAttribute("content", `${url.origin}/og-cover.jpg`);

  ensureMeta("name", "twitter:card").setAttribute("content", "summary_large_image");
  ensureMeta("name", "twitter:title").setAttribute("content", seo.ogTitle);
  ensureMeta("name", "twitter:description").setAttribute("content", seo.ogDescription);
  ensureMeta("name", "twitter:image").setAttribute("content", `${url.origin}/og-cover.jpg`);

  ensureLink("canonical").setAttribute("href", canonicalUrl);
  setAlternates(url.origin, url.pathname || "/");
  setAgencySchema({ locale, canonicalUrl, seo });
  setFaqSchema(faq);
  setArticleSchema({
    article: article
      ? {
          ...article,
          inLanguage: locale === "ru" ? "ru" : "en"
        }
      : null,
    canonicalUrl
  });
}
