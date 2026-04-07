import fs from "node:fs";
import path from "node:path";
import en from "../src/site-content/en.js";
import {
  BLOG_POST_PATHS,
  GEO_DETAIL_PATHS,
  SERVICE_DETAIL_PATHS,
  SITEMAP_ROUTES,
  STATIC_PAGE_PATHS
} from "../src/site.js";

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    out[key] = val;
  }

  return out;
}

function buildPageEntry(siteUrl, route) {
  const loc = `${siteUrl}${route.path === "/" ? "/" : route.path}`;

  return (
    `  <url>\n` +
    `    <loc>${loc}</loc>\n` +
    `    <xhtml:link rel="alternate" hreflang="en" href="${loc}?lang=en" />\n` +
    `    <xhtml:link rel="alternate" hreflang="ru" href="${loc}?lang=ru" />\n` +
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}?lang=en" />\n` +
    `    <changefreq>${route.changefreq}</changefreq>\n` +
    `    <priority>${route.priority}</priority>\n` +
    `  </url>\n`
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildCanonicalUrl(siteUrl, pathname, locale = "en") {
  const url = new URL(pathname || "/", siteUrl);
  url.searchParams.set("lang", locale);
  return url.toString();
}

function resolveRouteSpec(routePath) {
  if (routePath === STATIC_PAGE_PATHS.home) {
    return { kind: "page", key: "home", path: routePath };
  }

  for (const [key, value] of Object.entries(STATIC_PAGE_PATHS)) {
    if (value === routePath) return { kind: "page", key, path: routePath };
  }

  for (const [key, value] of Object.entries(SERVICE_DETAIL_PATHS)) {
    if (value === routePath) return { kind: "service", key, path: routePath };
  }

  for (const [key, value] of Object.entries(GEO_DETAIL_PATHS)) {
    if (value === routePath) return { kind: "geo", key, path: routePath };
  }

  for (const [key, value] of Object.entries(BLOG_POST_PATHS)) {
    if (value === routePath) return { kind: "post", key, path: routePath };
  }

  return { kind: "page", key: "home", path: STATIC_PAGE_PATHS.home };
}

function getRouteEntity(spec) {
  if (spec.kind === "page") return en.pages[spec.key];
  if (spec.kind === "service") return en.serviceDetails[spec.key];
  if (spec.kind === "geo") return en.geoDetails?.[spec.key];
  if (spec.kind === "post") return en.blogPosts?.[spec.key];
  return en.pages.home;
}

function buildBreadcrumbs(spec, entity, siteUrl) {
  const base = [{ name: "Home", item: `${siteUrl}/` }];

  if (spec.kind === "page") {
    if (spec.key === "home") return base;
    return [...base, { name: en.nav[spec.key] || spec.key, item: new URL(spec.path, siteUrl).toString() }];
  }

  if (spec.kind === "service") {
    return [
      ...base,
      { name: en.nav.services, item: new URL(STATIC_PAGE_PATHS.services, siteUrl).toString() },
      { name: entity?.hero?.title || entity?.title || "Service", item: new URL(spec.path, siteUrl).toString() }
    ];
  }

  if (spec.kind === "geo") {
    return [
      ...base,
      { name: en.nav.services, item: new URL(STATIC_PAGE_PATHS.services, siteUrl).toString() },
      { name: entity?.marketName || entity?.hero?.title || "Market", item: new URL(spec.path, siteUrl).toString() }
    ];
  }

  if (spec.kind === "post") {
    return [
      ...base,
      { name: en.nav.blog, item: new URL(STATIC_PAGE_PATHS.blog, siteUrl).toString() },
      { name: entity?.title || "Article", item: new URL(spec.path, siteUrl).toString() }
    ];
  }

  return base;
}

function buildAgencySchema({ siteUrl, canonicalUrl, seo }) {
  return {
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
    knowsLanguage: ["English", "Russian"],
    serviceType: [
      "TikTok growth strategy",
      "UGC production",
      "Performance creative testing",
      "Landing localization",
      "Multi-geo launch rollout"
    ],
    mainEntityOfPage: canonicalUrl,
    image: `${siteUrl}/og-cover.jpg`
  };
}

function buildFaqSchema(entity) {
  const items = entity?.faq?.items || [];
  if (!items.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }))
  };
}

function buildBreadcrumbSchema(breadcrumbs) {
  if (breadcrumbs.length < 2) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item
    }))
  };
}

function buildServiceSchema({ siteUrl, spec, entity, canonicalUrl }) {
  if (spec.kind !== "service" && spec.kind !== "geo") return null;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: entity?.hero?.title || entity?.title || "Buzztm Service",
    description: entity?.hero?.body || entity?.lede || "",
    url: canonicalUrl,
    serviceType: entity?.hero?.title || entity?.title || "TikTok marketing service",
    areaServed:
      spec.kind === "geo"
        ? [entity?.marketName || entity?.hero?.title || "Target market"]
        : entity?.areaServed || ["Europe", "CIS", "GCC", "MENA"],
    availableLanguage: ["en", "ru"],
    provider: {
      "@type": "MarketingAgency",
      name: "Buzztm",
      url: siteUrl
    }
  };
}

function buildArticleSchema(entity, canonicalUrl) {
  if (!entity?.meta?.published) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entity.title,
    description: entity.lede,
    datePublished: entity.meta.published,
    dateModified: entity.meta.published,
    inLanguage: "en",
    mainEntityOfPage: canonicalUrl,
    author: {
      "@type": "Organization",
      name: "Buzztm"
    },
    publisher: {
      "@type": "Organization",
      name: "Buzztm"
    }
  };
}

function buildStaticHtml({ siteUrl, spec, entity }) {
  const seo = entity?.seo || en.pages.home.seo;
  const canonicalUrl = buildCanonicalUrl(siteUrl, spec.path, "en");
  const ogType = spec.kind === "post" ? "article" : "website";
  const alternates = [
    { lang: "en", href: buildCanonicalUrl(siteUrl, spec.path, "en") },
    { lang: "ru", href: buildCanonicalUrl(siteUrl, spec.path, "ru") },
    { lang: "x-default", href: buildCanonicalUrl(siteUrl, spec.path, "en") }
  ];
  const breadcrumbs = buildBreadcrumbs(spec, entity, siteUrl);
  const schemas = [
    buildAgencySchema({ siteUrl, canonicalUrl, seo }),
    buildBreadcrumbSchema(breadcrumbs),
    buildFaqSchema(entity),
    buildServiceSchema({ siteUrl, spec, entity, canonicalUrl }),
    buildArticleSchema(entity, canonicalUrl)
  ].filter(Boolean);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="keywords" content="${escapeHtml(seo.keywords || "")}" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    <meta name="theme-color" content="#081018" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="Buzztm" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:title" content="${escapeHtml(seo.ogTitle || seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.ogDescription || seo.description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(`${siteUrl}/og-cover.jpg`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seo.ogTitle || seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.ogDescription || seo.description)}" />
    <meta name="twitter:image" content="${escapeHtml(`${siteUrl}/og-cover.jpg`)}" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
${alternates.map((item) => `    <link rel="alternate" hreflang="${item.lang}" href="${escapeHtml(item.href)}" />`).join("\n")}
    <title>${escapeHtml(seo.title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
    <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
${schemas.map((schema) => `    <script type="application/ld+json">${serializeJsonLd(schema)}</script>`).join("\n")}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
}

const localEnv = readEnv(path.resolve(".env"));
const exampleEnv = readEnv(path.resolve(".env.example"));
const siteUrl = (
  process.env.VITE_SITE_URL ||
  localEnv.VITE_SITE_URL ||
  exampleEnv.VITE_SITE_URL ||
  "https://example.com"
).replace(/\/$/, "");
const publicDir = path.resolve("public");

fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  SITEMAP_ROUTES.map((route) => buildPageEntry(siteUrl, route)).join("") +
  `  <url>\n` +
    `    <loc>${siteUrl}/thank-you.html</loc>\n` +
    `    <changefreq>monthly</changefreq>\n` +
  `    <priority>0.3</priority>\n` +
  `  </url>\n` +
  `</urlset>\n`;

fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemap);
console.log("Generated robots.txt and sitemap.xml for", siteUrl);

for (const route of SITEMAP_ROUTES) {
  const spec = resolveRouteSpec(route.path);
  const entity = getRouteEntity(spec);
  const relativeFile = route.path === "/" ? "index.html" : path.join(route.path.replace(/^\/+/, ""), "index.html");
  const outputPath = path.resolve(relativeFile);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buildStaticHtml({ siteUrl, spec, entity }));
}

console.log("Generated static HTML entries for", SITEMAP_ROUTES.length, "routes");
