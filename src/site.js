export const NAV_PAGES = ["home", "services", "cases", "about", "blog", "contact"];

export const STATIC_PAGE_PATHS = {
  home: "/",
  services: "/services/",
  about: "/about/",
  cases: "/cases/",
  blog: "/blog/",
  contact: "/contact/"
};

export const SERVICE_DETAIL_PATHS = {
  signalSprint: "/services/signal-sprint/",
  launchBurst: "/services/launch-burst/",
  multiGeoScale: "/services/multi-geo-scale/"
};

export const BLOG_POST_PATHS = {
  creativeTesting: "/blog/tiktok-creative-testing/",
  landingSystems: "/blog/localized-landing-systems/",
  launchSequencing: "/blog/multi-geo-launch-sequencing/"
};

export const SITEMAP_ROUTES = [
  { path: STATIC_PAGE_PATHS.home, priority: "1.0", changefreq: "weekly" },
  { path: STATIC_PAGE_PATHS.services, priority: "0.9", changefreq: "weekly" },
  { path: STATIC_PAGE_PATHS.cases, priority: "0.85", changefreq: "weekly" },
  { path: STATIC_PAGE_PATHS.about, priority: "0.75", changefreq: "monthly" },
  { path: STATIC_PAGE_PATHS.blog, priority: "0.85", changefreq: "weekly" },
  { path: STATIC_PAGE_PATHS.contact, priority: "0.8", changefreq: "monthly" },
  ...Object.values(SERVICE_DETAIL_PATHS).map((path) => ({
    path,
    priority: "0.8",
    changefreq: "monthly"
  })),
  ...Object.values(BLOG_POST_PATHS).map((path) => ({
    path,
    priority: "0.72",
    changefreq: "monthly"
  }))
];

function normalizePath(pathname = "/") {
  if (!pathname || pathname === "") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function resolveRoute(pathname = "/") {
  const normalized = normalizePath(pathname);

  for (const [page, path] of Object.entries(STATIC_PAGE_PATHS)) {
    if (normalized === path) {
      return { kind: "page", key: page, navKey: page, path };
    }
  }

  for (const [service, path] of Object.entries(SERVICE_DETAIL_PATHS)) {
    if (normalized === path) {
      return { kind: "service", key: service, navKey: "services", path };
    }
  }

  for (const [post, path] of Object.entries(BLOG_POST_PATHS)) {
    if (normalized === path) {
      return { kind: "post", key: post, navKey: "blog", path };
    }
  }

  return { kind: "page", key: "home", navKey: "home", path: STATIC_PAGE_PATHS.home };
}

export function buildPageHref(page, locale) {
  const path = STATIC_PAGE_PATHS[page] || STATIC_PAGE_PATHS.home;
  return `${path}?lang=${locale}`;
}

export function buildServiceHref(service, locale) {
  const path = SERVICE_DETAIL_PATHS[service] || STATIC_PAGE_PATHS.services;
  return `${path}?lang=${locale}`;
}

export function buildBlogPostHref(post, locale) {
  const path = BLOG_POST_PATHS[post] || STATIC_PAGE_PATHS.blog;
  return `${path}?lang=${locale}`;
}
