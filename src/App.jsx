import { useEffect, useState } from "react";
import adactedLogo from "../assets/real/adacted-logo.png";
import buzztmLive from "../assets/real/buzztm-live.webp";
import mmixLogo from "../assets/real/mmix-logo.png";
import caseEcom from "../assets/stitch/case-ecom.webp";
import caseInfobiz from "../assets/stitch/case-infobiz.webp";
import caseService from "../assets/stitch/case-service.webp";
import heroCollage from "../assets/stitch/hero-collage.webp";
import { initAnalytics, trackEvent, trackPageView } from "./analytics";
import { content, DEFAULT_LOCALE, resolveInitialLocale, SUPPORTED_LOCALES } from "./content";
import { applySeo } from "./seo";

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/adactedagency/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/73956025" },
  { label: "Facebook", href: "https://www.facebook.com/Adacted-102016908383521" }
];

const REFERENCE_LINKS = [
  { label: "MMIX TikTok article", href: "https://mmix.ua/en/nastrojka-reklamyi-v-tiktok/" },
  { label: "MMIX article RU/UA", href: "https://mmix.ua/ua/nalashtuvannya-reklami-v-tiktok/" },
  { label: "Live site", href: "https://www.buzztm.com" }
];

const CASE_MEDIA = [caseEcom, caseInfobiz, caseService];

function useRevealAnimations() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll(".reveal"));

    if (!nodes.length) return;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || typeof window.IntersectionObserver !== "function") {
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
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    nodes.forEach((node, index) => {
      node.style.transitionDelay = `${(index % 5) * 70}ms`;
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

function SectionHeader({ eyebrow, title, body, center = false }) {
  return (
    <div className={`section-header${center ? " section-header--center" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{body}</p>
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
          <textarea name="message" rows="5" placeholder={t.form.placeholders.message} />
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
    applySeo({ locale, seo: t.seo, heroImage: heroCollage, faq: t.faq.items });
    trackPageView({ locale, page: "landing" });
  }, [locale, t]);

  return (
    <>
      <div className="page-orb page-orb--cyan" />
      <div className="page-orb page-orb--rose" />
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
          <a href="#services">{t.nav.services}</a>
          <a href="#cases">{t.nav.cases}</a>
          <a href="#process">{t.nav.process}</a>
          <a href="#coverage">{t.nav.coverage}</a>
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
        <section className="hero-panel reveal" id="home">
          <div className="hero-copy">
            <p className="eyebrow eyebrow--strong">{t.hero.eyebrow}</p>
            <h1>{t.hero.title}</h1>
            <p className="hero-lede">{t.hero.lede}</p>

            <div className="cta-row">
              <a className="btn btn-primary" href="#contact">
                {t.cta.primary}
              </a>
              <a className="btn btn-ghost" href="#services">
                {t.cta.secondary}
              </a>
            </div>

            <div className="hero-stats" aria-label="Key performance signals">
              {t.hero.stats.map((item) => (
                <div key={item.label} className="stat-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <ul className="tag-row" aria-label="Launch model highlights">
              {t.hero.tags.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="hero-visual">
            <article className="hero-image-card">
              <img src={heroCollage} alt={t.hero.imageAlt} />
              <div className="hero-image-overlay">
                <span>{t.hero.liveLabel}</span>
                <strong>{t.hero.liveValue}</strong>
                <p>{t.hero.liveNote}</p>
              </div>
            </article>

            <article className="floating-card floating-card--proof">
              <span>{t.hero.proofCard.kicker}</span>
              <strong>{t.hero.proofCard.title}</strong>
              <p>{t.hero.proofCard.body}</p>
            </article>

            <article className="floating-card floating-card--ops">
              <div className="logo-stack" aria-label="Partner footprint">
                <img src={adactedLogo} alt="Adacted logo" />
                <img src={mmixLogo} alt="MMIX logo" />
              </div>
              <span>{t.hero.opsCard.kicker}</span>
              <strong>{t.hero.opsCard.title}</strong>
              <p>{t.hero.opsCard.body}</p>
            </article>
          </div>
        </section>

        <section className="section-block reveal">
          <SectionHeader
            eyebrow={t.pain.eyebrow}
            title={t.pain.title}
            body={t.pain.body}
            center
          />

          <div className="pain-grid">
            {t.pain.items.map((item, index) => (
              <article key={item.title} className="pain-card">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block reveal" id="services">
          <SectionHeader eyebrow={t.services.eyebrow} title={t.services.title} body={t.services.body} />

          <div className="service-grid">
            {t.services.items.map((item) => (
              <article key={item.title} className={`service-card${item.featured ? " service-card--featured" : ""}`}>
                <span className="service-label">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <ul>
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block reveal" id="process">
          <SectionHeader eyebrow={t.process.eyebrow} title={t.process.title} body={t.process.body} />

          <div className="process-grid">
            {t.process.steps.map((step) => (
              <article key={step.phase} className="process-card">
                <span>{step.phase}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block reveal" id="cases">
          <SectionHeader eyebrow={t.cases.eyebrow} title={t.cases.title} body={t.cases.body} />

          <div className="case-grid">
            {t.cases.items.map((item, index) => (
              <article key={item.title} className="case-card">
                <div className="case-media">
                  <img src={CASE_MEDIA[index]} alt={item.alt} />
                  <span>{item.segment}</span>
                </div>
                <div className="case-copy">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <div className="case-metric">
                    <strong>{item.metric}</strong>
                    <span>{item.metricLabel}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block reveal" id="coverage">
          <div className="coverage-layout">
            <div className="coverage-copy">
              <SectionHeader eyebrow={t.coverage.eyebrow} title={t.coverage.title} body={t.coverage.body} />

              <div className="coverage-grid">
                {t.coverage.regions.map((item) => (
                  <article key={item.name} className="coverage-card">
                    <h3>{item.name}</h3>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>

              <ul className="coverage-bullets">
                {t.coverage.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <aside className="proof-stack">
              <article className="proof-stack__shot">
                <img src={buzztmLive} alt={t.coverage.proofImageAlt} />
              </article>

              <article className="proof-stack__panel">
                <span>{t.coverage.panel.kicker}</span>
                <h3>{t.coverage.panel.title}</h3>
                <p>{t.coverage.panel.body}</p>

                <div className="inline-logos">
                  <img src={adactedLogo} alt="Adacted logo" />
                  <img src={mmixLogo} alt="MMIX logo" />
                </div>

                <div className="link-pills">
                  {REFERENCE_LINKS.map((item) => (
                    <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                      {item.label}
                    </a>
                  ))}
                </div>
              </article>
            </aside>
          </div>
        </section>

        <section className="section-block reveal">
          <SectionHeader eyebrow={t.faq.eyebrow} title={t.faq.title} body={t.faq.body} center />

          <div className="faq-list">
            {t.faq.items.map((item) => (
              <details key={item.q} className="faq-item">
                <summary>
                  <span>{item.q}</span>
                  <span className="faq-symbol">+</span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="contact-panel reveal" id="contact">
          <div className="contact-copy">
            <p className="eyebrow eyebrow--strong">{t.contact.eyebrow}</p>
            <h2>{t.contact.title}</h2>
            <p>{t.contact.body}</p>

            <ul className="contact-points">
              {t.contact.points.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="link-pills">
              {SOCIAL_LINKS.map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="contact-form-wrap">
            <LeadForm locale={locale} t={t} />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-wrap">
          <div>
            <strong>Buzztm</strong>
            <p>{t.footer.note}</p>
          </div>

          <div className="footer-links">
            {t.footer.links.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>

          <div className="footer-copy">{t.footer.copy}</div>
        </div>
      </footer>
    </>
  );
}
