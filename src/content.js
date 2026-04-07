import en from "./site-content/en";
import ru from "./site-content/ru";

export const SUPPORTED_LOCALES = ["en", "ru"];
export const DEFAULT_LOCALE = "en";

export const content = { en, ru };

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
