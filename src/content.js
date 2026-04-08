export const SUPPORTED_LOCALES = ["en", "ru"];
export const DEFAULT_LOCALE = "en";

const localeLoaders = {
  en: () => import("./site-content/en.js"),
  ru: () => import("./site-content/ru.js")
};

export async function loadLocaleContent(locale) {
  const loader = localeLoaders[locale] || localeLoaders[DEFAULT_LOCALE];
  const module = await loader();
  return module.default;
}

export function resolveInitialLocale() {
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("lang");
  if (SUPPORTED_LOCALES.includes(fromQuery)) return fromQuery;

  const stored = window.localStorage.getItem("locale");
  if (SUPPORTED_LOCALES.includes(stored)) return stored;

  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("ru")) return "ru";
  return DEFAULT_LOCALE;
}
