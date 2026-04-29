import fs from "node:fs";
import path from "node:path";
import en from "../src/site-content/en.js";
import {
  BLOG_POST_PATHS,
  GEO_DETAIL_PATHS,
  NAV_PAGES,
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

function buildWebsiteSchema({ siteUrl, seo }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Buzztm",
    url: siteUrl,
    description: seo.description,
    inLanguage: ["en", "ru"]
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

function pageHref(siteUrl, pageKey) {
  return buildCanonicalUrl(siteUrl, STATIC_PAGE_PATHS[pageKey] || "/", "en");
}

function serviceHref(siteUrl, key) {
  return buildCanonicalUrl(siteUrl, SERVICE_DETAIL_PATHS[key] || STATIC_PAGE_PATHS.services, "en");
}

function geoHref(siteUrl, key) {
  return buildCanonicalUrl(siteUrl, GEO_DETAIL_PATHS[key] || STATIC_PAGE_PATHS.services, "en");
}

function postHref(siteUrl, key) {
  return buildCanonicalUrl(siteUrl, BLOG_POST_PATHS[key] || STATIC_PAGE_PATHS.blog, "en");
}

function renderActionLinks(siteUrl, actions = []) {
  if (!actions.length) return "";

  return `<div class="static-actions">${actions
    .map(
      (item) =>
        `<a href="${escapeHtml(pageHref(siteUrl, item.page))}" class="static-button">${escapeHtml(item.label)}</a>`
    )
    .join("")}</div>`;
}

function renderMetrics(metrics = []) {
  if (!metrics.length) return "";

  return `<ul class="static-metrics">${metrics
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.label)}</span></li>`
    )
    .join("")}</ul>`;
}

function renderBullets(items = []) {
  if (!items.length) return "";
  return `<ul class="static-bullets">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderFaq(items = []) {
  if (!items.length) return "";

  return `<div class="static-faq">${items
    .map(
      (item) =>
        `<details><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details>`
    )
    .join("")}</div>`;
}

function renderSection({ eyebrow, title, body, content }) {
  return `<section class="static-section">
    ${eyebrow ? `<p class="static-eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
    ${title ? `<h2>${escapeHtml(title)}</h2>` : ""}
    ${body ? `<p class="static-body">${escapeHtml(body)}</p>` : ""}
    ${content || ""}
  </section>`;
}

function renderCards(items = [], { hrefForItem, fallbackCtaLabel, extraHtml } = {}) {
  if (!items.length) return "";

  return `<div class="static-grid">${items
    .map((item) => {
      const href = hrefForItem ? hrefForItem(item) : "";
      const ctaLabel = item.link || fallbackCtaLabel;

      return `<article class="static-card">
        ${item.label ? `<span class="static-label">${escapeHtml(item.label)}</span>` : ""}
        ${item.category ? `<span class="static-label">${escapeHtml(item.category)}</span>` : ""}
        ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ""}
        ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ""}
        ${item.excerpt ? `<p>${escapeHtml(item.excerpt)}</p>` : ""}
        ${item.lede ? `<p>${escapeHtml(item.lede)}</p>` : ""}
        ${extraHtml ? extraHtml(item) : ""}
        ${href && ctaLabel ? `<p><a href="${escapeHtml(href)}">${escapeHtml(ctaLabel)}</a></p>` : ""}
      </article>`;
    })
    .join("")}</div>`;
}

function renderIntro(siteUrl, intro) {
  if (!intro) return "";

  return `<section class="static-hero">
    ${intro.eyebrow ? `<p class="static-eyebrow">${escapeHtml(intro.eyebrow)}</p>` : ""}
    <h1>${escapeHtml(intro.title)}</h1>
    <p class="static-body">${escapeHtml(intro.body)}</p>
    ${renderActionLinks(siteUrl, intro.actions || [])}
    ${renderMetrics(intro.metrics || [])}
  </section>`;
}

function buildHomeSnapshot(siteUrl, page) {
  return [
    renderIntro(siteUrl, page.hero),
    page.hero?.form?.points?.length
      ? renderSection({
          eyebrow: "Why the first screen matters",
          title: page.hero.form.title,
          body: page.hero.form.body,
          content: renderBullets(page.hero.form.points)
        })
      : "",
    renderSection({
      eyebrow: page.pain.eyebrow,
      title: page.pain.title,
      body: page.pain.body,
      content: renderCards(page.pain.items)
    }),
    renderSection({
      eyebrow: page.services.eyebrow,
      title: page.services.title,
      body: page.services.body,
      content: renderCards(page.services.items, {
        hrefForItem: (item) => serviceHref(siteUrl, item.key)
      })
    }),
    page.serviceCluster?.items?.length
      ? renderSection({
          eyebrow: page.serviceCluster.eyebrow,
          title: page.serviceCluster.title,
          body: page.serviceCluster.body,
          content: renderCards(page.serviceCluster.items, {
            hrefForItem: (item) => serviceHref(siteUrl, item.key)
          })
        })
      : "",
    page.geoCluster?.items?.length
      ? renderSection({
          eyebrow: page.geoCluster.eyebrow,
          title: page.geoCluster.title,
          body: page.geoCluster.body,
          content: renderCards(page.geoCluster.items, {
            hrefForItem: (item) => geoHref(siteUrl, item.key)
          })
        })
      : "",
    renderSection({
      eyebrow: page.proof.eyebrow,
      title: page.proof.title,
      body: page.proof.body,
      content: renderBullets(page.proof.points)
    }),
    renderSection({
      eyebrow: page.blog.eyebrow,
      title: page.blog.title,
      body: page.blog.body,
      content: renderCards(page.blog.items, {
        hrefForItem: (item) => postHref(siteUrl, item.key),
        fallbackCtaLabel: page.blog.cta
      })
    }),
    renderSection({
      eyebrow: page.cta.eyebrow,
      title: page.cta.title,
      body: page.cta.body,
      content: `<p><a href="${escapeHtml(pageHref(siteUrl, "contact"))}">${escapeHtml(page.cta.primary)}</a></p>`
    })
  ].join("");
}

function buildServicesSnapshot(siteUrl, page) {
  return [
    renderIntro(siteUrl, page.intro),
    renderSection({
      eyebrow: page.packages.eyebrow,
      title: page.packages.title,
      body: page.packages.body,
      content: renderCards(page.packages.items, {
        hrefForItem: (item) => serviceHref(siteUrl, item.key),
        extraHtml: (item) => renderBullets(item.bullets || [])
      })
    }),
    renderSection({
      eyebrow: page.process.eyebrow,
      title: page.process.title,
      body: page.process.body,
      content: renderCards(page.process.steps, {
        extraHtml: (item) => `<p class="static-meta">${escapeHtml(item.phase)}</p>`
      })
    }),
    renderSection({
      eyebrow: page.deliverables.eyebrow,
      title: page.deliverables.title,
      body: page.deliverables.body,
      content: renderCards(page.deliverables.items)
    }),
    page.marketCoverage?.items?.length
      ? renderSection({
          eyebrow: page.marketCoverage.eyebrow,
          title: page.marketCoverage.title,
          body: page.marketCoverage.body,
          content: renderCards(page.marketCoverage.items, {
            hrefForItem: (item) => geoHref(siteUrl, item.key)
          })
        })
      : "",
    renderSection({
      eyebrow: page.faq.eyebrow,
      title: page.faq.title,
      body: page.faq.body,
      content: renderFaq(page.faq.items)
    })
  ].join("");
}

function buildAboutSnapshot(siteUrl, page) {
  return [
    renderIntro(siteUrl, page.intro),
    renderSection({
      eyebrow: page.story.eyebrow,
      title: page.story.title,
      body: page.story.body,
      content: renderCards(page.story.points)
    }),
    renderSection({
      eyebrow: page.principles.eyebrow,
      title: page.principles.title,
      body: page.principles.body,
      content: renderCards(page.principles.items)
    }),
    renderSection({
      eyebrow: page.footprint.eyebrow,
      title: page.footprint.title,
      body: page.footprint.body,
      content: renderBullets(page.footprint.items)
    }),
    renderSection({
      eyebrow: page.cta.eyebrow,
      title: page.cta.title,
      body: page.cta.body,
      content: `<p><a href="${escapeHtml(pageHref(siteUrl, "contact"))}">${escapeHtml(page.cta.primary)}</a></p>`
    })
  ].join("");
}

function buildCasesSnapshot(siteUrl, page) {
  return [
    renderIntro(siteUrl, page.intro),
    renderSection({
      eyebrow: page.cases.eyebrow,
      title: page.cases.title,
      body: page.cases.body,
      content: renderCards(page.cases.items, {
        extraHtml: (item) =>
          `<p class="static-meta"><strong>${escapeHtml(item.metric)}</strong> ${escapeHtml(item.metricLabel)}</p>`
      })
    }),
    renderSection({
      eyebrow: page.verticals.eyebrow,
      title: page.verticals.title,
      body: page.verticals.body,
      content: renderCards(page.verticals.items)
    }),
    renderSection({
      eyebrow: page.cta.eyebrow,
      title: page.cta.title,
      body: page.cta.body,
      content: `<p><a href="${escapeHtml(pageHref(siteUrl, "services"))}">${escapeHtml(page.cta.primary)}</a></p>`
    })
  ].join("");
}

function buildBlogSnapshot(siteUrl, page) {
  return [
    renderIntro(siteUrl, page.intro),
    renderSection({
      eyebrow: page.featured.eyebrow,
      title: page.featured.title,
      body: page.featured.body,
      content: `<p><a href="${escapeHtml(postHref(siteUrl, page.featured.key))}">${escapeHtml(page.featured.cta)}</a></p>`
    }),
    renderSection({
      eyebrow: page.posts.eyebrow,
      title: page.posts.title,
      body: page.posts.body,
      content: renderCards(page.posts.items, {
        hrefForItem: (item) => postHref(siteUrl, item.key),
        fallbackCtaLabel: "Read article",
        extraHtml: (item) => `<p class="static-meta">${escapeHtml(item.readTime)}</p>`
      })
    })
  ].join("");
}

function buildContactSnapshot(siteUrl, page) {
  return [
    renderIntro(siteUrl, page.hero),
    renderSection({
      eyebrow: "Qualification",
      title: page.qualify.title,
      body: page.qualify.body,
      content: renderBullets(page.qualify.points)
    }),
    renderSection({
      eyebrow: page.faq.eyebrow,
      title: page.faq.title,
      body: page.faq.body,
      content: renderFaq(page.faq.items)
    }),
    renderSection({
      eyebrow: "Direct paths",
      title: "Keep moving without waiting for JavaScript",
      body: "Use the contact page or service pages above if an AI crawler or minimal browser is reading this snapshot.",
      content: `<p><a href="${escapeHtml(pageHref(siteUrl, "contact"))}">Open contact page</a></p>`
    })
  ].join("");
}

function buildServiceDetailSnapshot(siteUrl, service) {
  return [
    renderIntro(siteUrl, service.hero),
    service.hero?.highlights?.length
      ? renderSection({
          eyebrow: "Best fit",
          title: "Where this offer works best",
          body: "Use this service when the offer, landing, and creative need to be treated as one commercial system.",
          content: renderBullets(service.hero.highlights)
        })
      : "",
    renderSection({
      eyebrow: service.outcomes.eyebrow,
      title: service.outcomes.title,
      body: service.outcomes.body,
      content: renderCards(service.outcomes.items)
    }),
    renderSection({
      eyebrow: service.scope.eyebrow,
      title: service.scope.title,
      body: service.scope.body,
      content: renderBullets(service.scope.items)
    }),
    renderSection({
      eyebrow: service.fit.eyebrow,
      title: service.fit.title,
      body: service.fit.body,
      content: renderCards(service.fit.items)
    }),
    service.relatedMarkets?.length
      ? renderSection({
          eyebrow: service.marketCoverage.eyebrow,
          title: service.marketCoverage.title,
          body: service.marketCoverage.body,
          content: renderCards(service.relatedMarkets, {
            hrefForItem: (item) => geoHref(siteUrl, item.key)
          })
        })
      : "",
    service.faq?.items?.length
      ? renderSection({
          eyebrow: service.faq.eyebrow,
          title: service.faq.title,
          body: service.faq.body,
          content: renderFaq(service.faq.items)
        })
      : "",
    renderSection({
      eyebrow: service.cta.eyebrow,
      title: service.cta.title,
      body: service.cta.body,
      content: `<p><a href="${escapeHtml(pageHref(siteUrl, "contact"))}">${escapeHtml(service.cta.primary)}</a></p>`
    })
  ].join("");
}

function buildGeoDetailSnapshot(siteUrl, geo) {
  return [
    renderIntro(siteUrl, geo.hero),
    renderSection({
      eyebrow: "Market panel",
      title: geo.marketPanel.title,
      body: "A compact view of how Buzztm frames launch work for this market.",
      content: renderBullets(geo.marketPanel.points)
    }),
    renderSection({
      eyebrow: geo.searchIntent.eyebrow,
      title: geo.searchIntent.title,
      body: geo.searchIntent.body,
      content: renderCards(geo.searchIntent.items)
    }),
    renderSection({
      eyebrow: geo.services.eyebrow,
      title: geo.services.title,
      body: geo.services.body,
      content: renderCards(geo.services.items, {
        hrefForItem: (item) => serviceHref(siteUrl, item.key)
      })
    }),
    geo.faq?.items?.length
      ? renderSection({
          eyebrow: geo.faq.eyebrow,
          title: geo.faq.title,
          body: geo.faq.body,
          content: renderFaq(geo.faq.items)
        })
      : "",
    renderSection({
      eyebrow: geo.cta.eyebrow,
      title: geo.cta.title,
      body: geo.cta.body,
      content: `<p><a href="${escapeHtml(pageHref(siteUrl, "contact"))}">${escapeHtml(geo.cta.primary)}</a></p>`
    })
  ].join("");
}

function buildBlogPostSnapshot(siteUrl, post, spec) {
  return [
    `<section class="static-hero">
      <p class="static-eyebrow">${escapeHtml(post.meta.category)}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p class="static-body">${escapeHtml(post.lede)}</p>
      <p class="static-meta">${escapeHtml(post.meta.readTime)} • ${escapeHtml(post.meta.published)}</p>
    </section>`,
    `<section class="static-section">${post.sections
      .map(
        (section) => `<article class="static-article-section">
          <h2>${escapeHtml(section.title)}</h2>
          ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          ${renderBullets(section.bullets || [])}
        </article>`
      )
      .join("")}</section>`,
    renderSection({
      eyebrow: post.cta.eyebrow,
      title: post.cta.title,
      body: post.cta.body,
      content: `<p><a href="${escapeHtml(postHref(siteUrl, spec.key))}">${escapeHtml("Open canonical article")}</a></p>`
    })
  ].join("");
}

function buildSnapshotContent({ siteUrl, spec, entity }) {
  if (spec.kind === "service") return buildServiceDetailSnapshot(siteUrl, entity);
  if (spec.kind === "geo") return buildGeoDetailSnapshot(siteUrl, entity);
  if (spec.kind === "post") return buildBlogPostSnapshot(siteUrl, entity, spec);

  if (spec.key === "home") return buildHomeSnapshot(siteUrl, entity);
  if (spec.key === "services") return buildServicesSnapshot(siteUrl, entity);
  if (spec.key === "about") return buildAboutSnapshot(siteUrl, entity);
  if (spec.key === "cases") return buildCasesSnapshot(siteUrl, entity);
  if (spec.key === "blog") return buildBlogSnapshot(siteUrl, entity);
  if (spec.key === "contact") return buildContactSnapshot(siteUrl, entity);

  return renderIntro(siteUrl, entity.intro || entity.hero);
}

function buildBreadcrumbMarkup(breadcrumbs) {
  return `<nav class="static-breadcrumbs" aria-label="Breadcrumb">${breadcrumbs
    .map((item) => `<a href="${escapeHtml(`${item.item}?lang=en`)}">${escapeHtml(item.name)}</a>`)
    .join("<span>/</span>")}</nav>`;
}

function buildNav(siteUrl) {
  return `<nav class="static-nav" aria-label="Primary">${NAV_PAGES.map(
    (page) => `<a href="${escapeHtml(pageHref(siteUrl, page))}">${escapeHtml(en.nav[page])}</a>`
  ).join("")}</nav>`;
}

function buildSnapshotCss() {
  return `
    @font-face {
      font-family: "Plus Jakarta Sans";
      font-style: normal;
      font-weight: 500 800;
      font-display: swap;
      src: url("/fonts/plus-jakarta-sans-cyrillic-ext.woff2") format("woff2");
      unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }

    @font-face {
      font-family: "Plus Jakarta Sans";
      font-style: normal;
      font-weight: 500 800;
      font-display: swap;
      src: url("/fonts/plus-jakarta-sans-latin-ext.woff2") format("woff2");
      unicode-range:
        U+0100-02BA,
        U+02BD-02C5,
        U+02C7-02CC,
        U+02CE-02D7,
        U+02DD-02FF,
        U+0304,
        U+0308,
        U+0329,
        U+1D00-1DBF,
        U+1E00-1E9F,
        U+1EF2-1EFF,
        U+2020,
        U+20A0-20AB,
        U+20AD-20C0,
        U+2113,
        U+2C60-2C7F,
        U+A720-A7FF;
    }

    @font-face {
      font-family: "Plus Jakarta Sans";
      font-style: normal;
      font-weight: 500 800;
      font-display: swap;
      src: url("/fonts/plus-jakarta-sans-latin.woff2") format("woff2");
      unicode-range:
        U+0000-00FF,
        U+0131,
        U+0152-0153,
        U+02BB-02BC,
        U+02C6,
        U+02DA,
        U+02DC,
        U+0304,
        U+0308,
        U+0329,
        U+2000-206F,
        U+20AC,
        U+2122,
        U+2191,
        U+2193,
        U+2212,
        U+2215,
        U+FEFF,
        U+FFFD;
    }

    :root {
      color-scheme: dark;
      --bg: #081018;
      --panel: rgba(11, 20, 32, 0.92);
      --line: rgba(130, 156, 184, 0.22);
      --text: #f4f8fb;
      --muted: #a6b5c5;
      --accent: #35f6ed;
      --accent-soft: #98fff8;
      --max: 1160px;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Plus Jakarta Sans", "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(53, 246, 237, 0.18), transparent 28%),
        linear-gradient(180deg, #071019 0%, #09131d 42%, #071019 100%);
    }

    a { color: var(--accent-soft); }
    .static-shell {
      width: min(calc(100% - 2rem), var(--max));
      margin: 0 auto;
      padding: 1rem 0 3rem;
    }

    .static-header,
    .static-section,
    .static-hero,
    .static-footer {
      border: 1px solid var(--line);
      border-radius: 24px;
      background: var(--panel);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.24);
    }

    .static-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
      padding: 1rem 1.25rem;
      margin-bottom: 1rem;
    }

    .static-brand {
      color: var(--text);
      font-weight: 800;
      font-size: 1.05rem;
      letter-spacing: 0.06em;
      text-decoration: none;
      text-transform: uppercase;
    }

    .static-nav,
    .static-actions,
    .static-footer-links,
    .static-breadcrumbs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }

    .static-nav a,
    .static-actions a,
    .static-footer a,
    .static-breadcrumbs a {
      text-decoration: none;
    }

    .static-main {
      display: grid;
      gap: 1rem;
    }

    .static-breadcrumbs {
      color: var(--muted);
      font-size: 0.92rem;
    }

    .static-breadcrumbs span {
      opacity: 0.6;
    }

    .static-hero,
    .static-section,
    .static-footer {
      padding: 1.35rem;
    }

    .static-hero h1,
    .static-section h2 {
      margin: 0 0 0.6rem;
      line-height: 1.05;
    }

    .static-hero h1 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      max-width: 14ch;
    }

    .static-eyebrow,
    .static-label,
    .static-meta {
      color: var(--muted);
      font-size: 0.82rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .static-body {
      max-width: 70ch;
      font-size: 1.02rem;
      line-height: 1.65;
    }

    .static-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.72rem 1rem;
      border-radius: 999px;
      color: #041013;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-soft) 100%);
      font-weight: 700;
    }

    .static-metrics,
    .static-bullets {
      margin: 1rem 0 0;
      padding-left: 1.2rem;
    }

    .static-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.8rem;
      padding: 0;
      list-style: none;
    }

    .static-metrics li,
    .static-card,
    .static-faq details {
      border: 1px solid var(--line);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.02);
      padding: 0.95rem;
    }

    .static-metrics strong {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 1.15rem;
    }

    .static-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.85rem;
    }

    .static-card h3 {
      margin: 0.35rem 0 0.45rem;
    }

    .static-faq {
      display: grid;
      gap: 0.75rem;
    }

    .static-faq summary {
      cursor: pointer;
      font-weight: 700;
    }

    .static-article-section + .static-article-section {
      margin-top: 1.1rem;
      padding-top: 1.1rem;
      border-top: 1px solid var(--line);
    }

    .static-footer {
      margin-top: 1rem;
    }

    .static-footer p {
      margin-top: 0;
      max-width: 70ch;
      color: var(--muted);
      line-height: 1.65;
    }

    @media (max-width: 720px) {
      .static-shell {
        width: min(calc(100% - 1rem), var(--max));
      }

      .static-header,
      .static-hero,
      .static-section,
      .static-footer {
        padding: 1rem;
        border-radius: 18px;
      }
    }
  `;
}

function buildLlmsTxt(siteUrl) {
  const serviceLines = en.pages.services.packages.items
    .slice(0, 6)
    .map((item) => `- ${item.title}: ${serviceHref(siteUrl, item.key)}`)
    .join("\n");
  const geoLines = (en.pages.home.geoCluster?.items || [])
    .map((item) => `- ${item.title}: ${geoHref(siteUrl, item.key)}`)
    .join("\n");

  return `# Buzztm

> ${en.pages.home.hero.body}

Main site: ${siteUrl}/
Sitemap: ${siteUrl}/sitemap.xml
Canonical contact page: ${pageHref(siteUrl, "contact")}
Extended AI-readable brief: ${siteUrl}/llms-full.txt

## Core pages
- Home: ${pageHref(siteUrl, "home")}
- Services: ${pageHref(siteUrl, "services")}
- Cases: ${pageHref(siteUrl, "cases")}
- About: ${pageHref(siteUrl, "about")}
- Blog: ${pageHref(siteUrl, "blog")}
- Contact: ${pageHref(siteUrl, "contact")}

## Core offers
${serviceLines}

## GEO pages
${geoLines}
`;
}

function buildLlmsFull(siteUrl) {
  const serviceBlocks = en.pages.services.packages.items
    .map(
      (item) =>
        `### ${item.title}\nURL: ${serviceHref(siteUrl, item.key)}\nSummary: ${item.body}\n`
    )
    .join("\n");
  const tacticalBlocks = (en.pages.home.serviceCluster?.items || [])
    .map(
      (item) =>
        `### ${item.title}\nURL: ${serviceHref(siteUrl, item.key)}\nSummary: ${item.body}\n`
    )
    .join("\n");
  const geoBlocks = (en.pages.home.geoCluster?.items || [])
    .map(
      (item) =>
        `### ${item.title}\nURL: ${geoHref(siteUrl, item.key)}\nSummary: ${item.body}\n`
    )
    .join("\n");
  const postBlocks = en.pages.blog.posts.items
    .map(
      (item) =>
        `### ${item.title}\nURL: ${postHref(siteUrl, item.key)}\nSummary: ${item.excerpt}\n`
    )
    .join("\n");

  return `# Buzztm Full Brief

## Overview
Buzztm is a TikTok growth systems and launch execution partner for brands that need qualified demand instead of vanity reach.

Primary promise: ${en.pages.home.hero.body}

Commercial framing:
${en.pages.home.proof.points.map((item) => `- ${item}`).join("\n")}

## Primary package pages
${serviceBlocks}

## Tactical service pages
${tacticalBlocks}

## GEO launch pages
${geoBlocks}

## Articles
${postBlocks}

## Contact and next step
Contact page: ${pageHref(siteUrl, "contact")}
Recommended first action: use the contact page or review the services index to match the offer to the stage of launch.
`;
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
    buildWebsiteSchema({ siteUrl, seo }),
    buildBreadcrumbSchema(breadcrumbs),
    buildFaqSchema(entity),
    buildServiceSchema({ siteUrl, spec, entity, canonicalUrl }),
    buildArticleSchema(entity, canonicalUrl)
  ].filter(Boolean);
  const snapshot = buildSnapshotContent({ siteUrl, spec, entity });

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
    <style>${buildSnapshotCss()}</style>
${schemas.map((schema) => `    <script type="application/ld+json">${serializeJsonLd(schema)}</script>`).join("\n")}
  </head>
  <body>
    <div id="root">
      <div class="static-shell">
        <header class="static-header">
          <a class="static-brand" href="${escapeHtml(pageHref(siteUrl, "home"))}">Buzztm</a>
          ${buildNav(siteUrl)}
        </header>
        <main class="static-main">
          ${buildBreadcrumbMarkup(breadcrumbs)}
          ${snapshot}
        </main>
        <footer class="static-footer">
          <p>
            This static snapshot is generated so search engines, AI crawlers, and low-JS browsers can read the site
            structure immediately. The interactive React layer loads on top of the same route.
          </p>
          <div class="static-footer-links">
            <a href="${escapeHtml(`${siteUrl}/llms.txt`)}">llms.txt</a>
            <a href="${escapeHtml(`${siteUrl}/llms-full.txt`)}">llms-full.txt</a>
            <a href="${escapeHtml(`${siteUrl}/sitemap.xml`)}">sitemap.xml</a>
          </div>
        </footer>
      </div>
    </div>
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

fs.writeFileSync(
  path.join(publicDir, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n# AI discovery\n# ${siteUrl}/llms.txt\n# ${siteUrl}/llms-full.txt\n`
);

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
fs.writeFileSync(path.join(publicDir, "llms.txt"), buildLlmsTxt(siteUrl));
fs.writeFileSync(path.join(publicDir, "llms-full.txt"), buildLlmsFull(siteUrl));
console.log("Generated robots.txt, sitemap.xml, llms.txt, and llms-full.txt for", siteUrl);

for (const route of SITEMAP_ROUTES) {
  const spec = resolveRouteSpec(route.path);
  const entity = getRouteEntity(spec);
  const relativeFile = route.path === "/" ? "index.html" : path.join(route.path.replace(/^\/+/, ""), "index.html");
  const outputPath = path.resolve(relativeFile);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buildStaticHtml({ siteUrl, spec, entity }));
}

for (const file of fs.readdirSync(publicDir)) {
  if (!/^google[a-z0-9]+\.html$/i.test(file)) continue;
  const sourcePath = path.join(publicDir, file);
  const extensionlessPath = path.join(publicDir, file.replace(/\.html$/i, ""));

  fs.copyFileSync(sourcePath, extensionlessPath);
}

console.log("Generated static HTML entries for", SITEMAP_ROUTES.length, "routes");
