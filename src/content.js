import en from "./locales/en";
import ru from "./locales/ru";
import uk from "./locales/uk";

export const SUPPORTED_LOCALES = ["en", "ru", "uk"];
export const DEFAULT_LOCALE = "en";

export const content = { en, ru, uk };

export function resolveInitialLocale() {
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("lang");
  if (SUPPORTED_LOCALES.includes(fromQuery)) return fromQuery;

  const stored = window.localStorage.getItem("locale");
  if (SUPPORTED_LOCALES.includes(stored)) return stored;

  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("uk")) return "uk";
  if (nav.startsWith("ru")) return "ru";
  return DEFAULT_LOCALE;
}
