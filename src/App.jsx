import { useEffect, useState } from "react";
import adactedLogo from "../assets/real/adacted-logo.png";
import buzztmLive from "../assets/real/buzztm-live.webp";
import buzztmTikTok from "../assets/real/buzztm-tiktok.webp";
import instagramProfile from "../assets/real/instagram-profile.jpg";
import mmixArticle from "../assets/real/mmix-article.webp";
import mmixLogo from "../assets/real/mmix-logo.png";
import { initAnalytics, trackEvent, trackPageView } from "./analytics";
import { content, DEFAULT_LOCALE, resolveInitialLocale, SUPPORTED_LOCALES } from "./content";
import { applySeo } from "./seo";

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/adactedagency/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/73956025" },
  { label: "Facebook", href: "https://www.facebook.com/Adacted-102016908383521" }
];

const RESOURCE_LINKS = [
  { label: "TikTok ads article", href: "https://mmix.ua/en/nastrojka-reklamyi-v-tiktok/" },
  { label: "Український матеріал", href: "https://mmix.ua/ua/nalashtuvannya-reklami-v-tiktok/" }
];

function useRevealAnimations() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from(document.querySelectorAll(".reveal"));

    if (reduceMotion) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );

    nodes.forEach((node, index) => {
      node.style.transitionDelay = `${(index % 4) * 55}ms`;
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);
}

function LocaleSwitcher({ locale, onChange }) {
  return (
    <div className="locale-switcher" role="group" aria-label="Language switcher">
      {SUPPORTED_LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={`locale-pill${locale === code ? " is-active" : ""}`}
          onClick={() => onChange(code)}
          aria-pressed={locale === code}
        >
          {content[code].shortLabel}
        </button>
      ))}
    </div>
  );
}

async function submitLeadForm(form, locale) {
  const endpoint = import.meta.env.VITE_FORM_ENDPOINT;
  const provider = (import.meta.env.VITE_FORM_PROVIDER || "").toLowerCase();
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  const data = new FormData(form);

  if (String(data.get("website") || "").trim()) {
    return { ok: true, spam: true };
  }

  data.append("locale", locale);
  data.append("page_url", window.location.href);
  data.append("page_title", document.title);
  data.append("submitted_at", new Date().toISOString());

  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) => {
    const value = new URLSearchParams(window.location.search).get(key);
    if (value) data.append(key, value);
  });

  if (!endpoint) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return { ok: true, demo: true };
  }

  if (provider === "web3forms" && accessKey) {
    data.append("access_key", accessKey);
    data.append("subject", `Buzztm Inbound Lead (${locale.toUpperCase()})`);
    data.append("from_name", "Buzztm");
    data.append("replyto", String(data.get("email") || ""));
  }

  const response = await fetch(endpoint, { method: "POST", body: data });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { ok: response.ok && (!payload || payload.success !== false), payload };
}

function LeadForm({ locale, t }) {
  const [status, setStatus] = useState("idle");
  const liveMode = Boolean(import.meta.env.VITE_FORM_ENDPOINT);
  const redirectOnSuccess = String(import.meta.env.VITE_ENABLE_FORM_REDIRECT || "false") === "true";
  const thankYouUrl = import.meta.env.VITE_THANK_YOU_URL || "/thank-you.html";

  function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");
    trackEvent("form_submit", { form_name: "lead_form", locale });

    submitLeadForm(event.currentTarget, locale)
      .then((result) => {
        if (!result.ok) throw new Error("submit_failed");
        setStatus("success");
        trackEvent("generate_lead", { form_name: "lead_form", locale, mode: liveMode ? "live" : "demo" });
        event.currentTarget.reset();

        if (redirectOnSuccess) {
          const nextUrl = new URL(thankYouUrl, window.location.origin);
          nextUrl.searchParams.set("lang", locale);
          window.location.assign(nextUrl.toString());
        }
      })
      .catch(() => {
        setStatus("error");
        trackEvent("form_error", { form_name: "lead_form", locale });
      });
  }

  return (
    <form className={`lead-form${status === "success" ? " submitted" : ""}`} onSubmit={handleSubmit} noValidate>
      <input className="bot-field" type="text" name="website" tabIndex="-1" autoComplete="off" />

      <div className="form-grid">
        <label>
          <span>{t.form.name}</span>
          <input type="text" name="name" placeholder={t.form.placeholders.name} required autoComplete="name" />
        </label>
        <label>
          <span>{t.form.email}</span>
          <input type="email" name="email" placeholder={t.form.placeholders.email} required autoComplete="email" />
        </label>
        <label>
          <span>{t.form.company}</span>
          <input type="text" name="company" placeholder={t.form.placeholders.company} autoComplete="organization" />
        </label>
        <label>
          <span>{t.form.interest}</span>
          <select name="interest" defaultValue="" required>
            <option value="" disabled>
              {t.form.select}
            </option>
            {t.form.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="full">
          <span>{t.form.message}</span>
          <textarea name="message" rows="4" placeholder={t.form.placeholders.message} />
        </label>
      </div>

      <label className="consent-line">
        <input type="checkbox" name="consent" required />
        <span>{t.form.consent}</span>
      </label>

      <div className="form-actions-row">
        <button className="btn btn-primary" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "..." : t.cta.send}
        </button>
        <p className="form-note">{liveMode ? t.contact.noteLive : t.contact.noteDemo}</p>
      </div>

      {status === "success" && <p className="form-success">{t.form.success}</p>}
      {status === "error" && <p className="form-error">{t.form.error}</p>}
    </form>
  );
}

export default function App() {
  const [locale, setLocale] = useState(() => (typeof window === "undefined" ? DEFAULT_LOCALE : resolveInitialLocale()));
  const t = content[locale] || content.en;

  useRevealAnimations();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", locale);
    window.history.replaceState({}, "", url);
    window.localStorage.setItem("locale", locale);
    applySeo({ locale, seo: t.seo });
    trackPageView({ locale, page: "landing" });
  }, [locale, t]);

  return (
    <>
      <div className="page-orb page-orb--lime" />
      <div className="page-orb page-orb--coral" />
      <div className="page-grid" />

      <header className="shell topbar reveal">
        <a className="brand" href="#home" aria-label="Buzztm home">
          <span className="brand-mark">BZ</span>
          <span className="brand-copy">
            <strong>Buzztm</strong>
            <small>{t.brandTag}</small>
          </span>
        </a>

        <nav className="nav" aria-label="Primary">
          <a href="#signal">{t.nav.signal}</a>
          <a href="#cases">{t.nav.cases}</a>
          <a href="#process">{t.nav.process}</a>
          <a href="#contact">{t.nav.contact}</a>
        </nav>

        <div className="topbar-actions">
          <LocaleSwitcher locale={locale} onChange={setLocale} />
          <a className="btn btn-ghost btn-sm" href="#contact">
            {t.cta.primary}
          </a>
        </div>
      </header>

      <main className="shell site-main">
        <section className="hero reveal" id="home">
          <div className="hero-copy">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1>{t.hero.title}</h1>
            <p className="hero-lede">{t.hero.lede}</p>

            <div className="stat-row" aria-label="Key signals">
              {t.hero.stats.map(([value, label]) => (
                <div key={label} className="stat-row__item">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="cta-row">
              <a className="btn btn-primary" href="#contact">
                {t.cta.primary}
              </a>
              <a className="btn btn-outline" href="#signal">
                {t.cta.secondary}
              </a>
            </div>

            <div className="hero-tags" aria-label="Positioning points">
              {t.hero.tags.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className="hero-media">
            <div className="hero-media__frame">
              <img src={buzztmTikTok} alt="Buzztm TikTok visual from the current public site" />
            </div>

            <div className="hero-media__card hero-media__card--logo">
              <img src={adactedLogo} alt="Adacted logo from the current public site" />
              <div>
                <span>Public mark</span>
                <strong>{t.hero.publicMark}</strong>
              </div>
            </div>

            <div className="hero-media__card hero-media__card--profile">
              <img src={instagramProfile} alt="Adacted Instagram profile image" />
              <div>
                <span>Instagram</span>
                <strong>@adactedagency</strong>
              </div>
            </div>

            <div className="hero-media__ribbon">{t.hero.ribbon}</div>
          </div>
        </section>

        <section className="signal-stage reveal" id="signal">
          <div className="section-head">
            <p className="eyebrow">{t.signals.eyebrow}</p>
            <h2>{t.signals.title}</h2>
            <p>{t.signals.body}</p>
            <ul className="signal-bullets">
              {t.signals.points.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="signal-layout">
            <article className="signal-card signal-card--wide">
              <img src={buzztmLive} alt="Current live Buzztm site screenshot" />
              <div className="signal-card__body">
                <span>{t.signals.cards.live.kicker}</span>
                <h3>{t.signals.cards.live.title}</h3>
                <p>{t.signals.cards.live.body}</p>
                <a href="https://www.buzztm.com" target="_blank" rel="noreferrer">
                  {t.signals.cards.live.link}
                </a>
              </div>
            </article>

            <article className="signal-card">
              <img src={mmixArticle} alt="MMIX TikTok article screenshot" />
              <div className="signal-card__body">
                <span>{t.signals.cards.article.kicker}</span>
                <h3>{t.signals.cards.article.title}</h3>
                <p>{t.signals.cards.article.body}</p>
                <a href="https://mmix.ua/en/nastrojka-reklamyi-v-tiktok/" target="_blank" rel="noreferrer">
                  {t.signals.cards.article.link}
                </a>
              </div>
            </article>

            <article className="signal-card signal-card--stack">
              <div className="signal-stack__logos">
                <img src={adactedLogo} alt="Adacted logo" />
                <img src={mmixLogo} alt="MMIX logo" />
              </div>
              <div className="signal-card__body">
                <span>{t.signals.cards.footprint.kicker}</span>
                <h3>{t.signals.cards.footprint.title}</h3>
                <p>{t.signals.cards.footprint.body}</p>
              </div>
              <div className="signal-links" aria-label="Public channels">
                {SOCIAL_LINKS.map((item) => (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                    {item.label}
                  </a>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="cases-section reveal" id="cases">
          <div className="section-head">
            <p className="eyebrow">{t.useCases.eyebrow}</p>
            <h2>{t.useCases.title}</h2>
            <p>{t.useCases.body}</p>
          </div>

          <div className="cases-grid">
            {t.useCases.items.map((item) => (
              <article key={item.title} className="case-card">
                <div className="case-mark">{item.code}</div>
                <div className="case-copy">
                  <span>{item.kicker}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
                <strong className="case-result">{item.result}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="modes-section reveal">
          <div className="section-head">
            <p className="eyebrow">{t.modes.eyebrow}</p>
            <h2>{t.modes.title}</h2>
            <p>{t.modes.body}</p>
          </div>

          <div className="modes-grid">
            {t.modes.items.map((item) => (
              <article key={item.title} className={`mode-card${item.featured ? " mode-card--featured" : ""}`}>
                <span>{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <strong>{item.outcome}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="process-section reveal" id="process">
          <div className="section-head">
            <p className="eyebrow">{t.process.eyebrow}</p>
            <h2>{t.process.title}</h2>
            <p>{t.process.body}</p>
          </div>

          <div className="process-track">
            {t.process.steps.map((step) => (
              <article key={step.title} className="step-card">
                <span>{step.phase}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="contact-section reveal" id="contact">
          <div className="contact-copy">
            <p className="eyebrow">{t.contact.eyebrow}</p>
            <h2>{t.contact.title}</h2>
            <p>{t.contact.body}</p>

            <ul className="contact-list">
              {t.contact.points.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="contact-links">
              {SOCIAL_LINKS.map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ))}
              {RESOURCE_LINKS.map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <LeadForm locale={locale} t={t} />
        </section>
      </main>

      <footer className="shell footer reveal">
        <p>{t.footer}</p>
      </footer>
    </>
  );
}
