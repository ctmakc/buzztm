export const SITE_PAGES = ["home", "services", "about", "cases", "contact"];

export const PAGE_PATHS = {
  home: "/",
  services: "/services/",
  about: "/about/",
  cases: "/cases/",
  contact: "/contact/"
};

export function resolvePageFromPath(pathname = "/") {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;

  for (const [page, path] of Object.entries(PAGE_PATHS)) {
    if (normalized === path) return page;
  }

  return "home";
}
