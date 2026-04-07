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
import { PAGE_PATHS, SITE_PAGES, resolvePageFromPath } from "./site";

const CASE_MEDIA = [caseEcom, caseInfobiz, caseService];

const FOOTPRINT_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/adactedagency/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/73956025" },
  { label: "Facebook", href: "https://www.facebook.com/Adacted-102016908383521" },
  { label: "MMIX article", href: "https://mmix.ua/en/nastrojka-reklamyi-v-tiktok/" }
];

function buildPageHref(page, locale) {
  const path = PAGE_PATHS[page] || "/";
  return `${path}?lang=${locale}`;
}

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

function PageIntro({ page, locale, t }) {
  return (
    <section className="hero-panel reveal">
      <div className="hero-copy">
        <p className="eyebrow eyebrow--strong">{page.intro.eyebrow}</p>
        <h1>{page.intro.title}</h1>
        <p className="hero-lede">{page.intro.body}</p>

        {page.intro.actions?.length ? (
          <div className="cta-row">
            {page.intro.actions.map((item, index) => (
              <a
                key={item.page}
                className={`btn ${index === 0 ? "btn-primary" : "btn-ghost"}`}
                href={buildPageHref(item.page, locale)}
              >
                {item.label}
              </a>
            ))}
          </div>
        ) : null}

        {page.intro.metrics?.length ? (
          <div className="hero-stats">
            {page.intro.metrics.map((item) => (
              <div key={item.label} className="stat-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="hero-visual">
        <article className="hero-image-card">
          <img src={page.intro.image === "live" ? buzztmLive : heroCollage} alt={page.intro.imageAlt} />
          <div className="hero-image-overlay">
            <span>{page.intro.overlay.kicker}</span>
            <strong>{page.intro.overlay.title}</strong>
            <p>{page.intro.overlay.body}</p>
          </div>
        </article>

        <article className="floating-card floating-card--proof">
          <span>{page.intro.aside.kicker}</span>
          <strong>{page.intro.aside.title}</strong>
          <p>{page.intro.aside.body}</p>
        </article>

        <article className="floating-card floating-card--ops">
          <div className="logo-stack" aria-label="Partner footprint">
            <img src={adactedLogo} alt="Adacted logo" />
            <img src={mmixLogo} alt="MMIX logo" />
          </div>
          <span>{page.intro.footprint.kicker}</span>
          <strong>{page.intro.footprint.title}</strong>
          <p>{page.intro.footprint.body}</p>
        </article>
      </div>
    </section>
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

function HomePage({ t, locale }) {
  const page = t.pages.home;

  return (
    <>
      <PageIntro page={page} locale={locale} t={t} />

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.pain.eyebrow} title={page.pain.title} body={page.pain.body} center />
        <div className="pain-grid">
          {page.pain.items.map((item, index) => (
            <article key={item.title} className="pain-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.pages.eyebrow} title={page.pages.title} body={page.pages.body} />
        <div className="service-grid">
          {page.pages.items.map((item) => (
            <article key={item.title} className="service-card">
              <span className="service-label">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <a className="text-link" href={buildPageHref(item.page, locale)}>
                {item.link}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block reveal">
        <div className="coverage-layout">
          <div className="coverage-copy">
            <SectionHeader eyebrow={page.geo.eyebrow} title={page.geo.title} body={page.geo.body} />
            <div className="coverage-grid">
              {page.geo.regions.map((item) => (
                <article key={item.name} className="coverage-card">
                  <h3>{item.name}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            <ul className="coverage-bullets">
              {page.geo.points.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <aside className="proof-stack">
            <article className="proof-stack__shot">
              <img src={buzztmLive} alt={page.geo.imageAlt} />
            </article>
            <article className="proof-stack__panel">
              <span>{page.geo.panel.kicker}</span>
              <h3>{page.geo.panel.title}</h3>
              <p>{page.geo.panel.body}</p>
              <div className="inline-logos">
                <img src={adactedLogo} alt="Adacted logo" />
                <img src={mmixLogo} alt="MMIX logo" />
              </div>
              <div className="link-pills">
                {FOOTPRINT_LINKS.map((item) => (
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
        <div className="cta-band">
          <div>
            <p className="eyebrow">{page.cta.eyebrow}</p>
            <h2>{page.cta.title}</h2>
            <p>{page.cta.body}</p>
          </div>
          <div className="cta-row">
            <a className="btn btn-primary" href={buildPageHref("contact", locale)}>
              {page.cta.primary}
            </a>
            <a className="btn btn-ghost" href={buildPageHref("services", locale)}>
              {page.cta.secondary}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function ServicesPage({ t, locale }) {
  const page = t.pages.services;

  return (
    <>
      <PageIntro page={page} locale={locale} t={t} />

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.packages.eyebrow} title={page.packages.title} body={page.packages.body} />
        <div className="service-grid">
          {page.packages.items.map((item) => (
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

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.process.eyebrow} title={page.process.title} body={page.process.body} />
        <div className="process-grid">
          {page.process.steps.map((step) => (
            <article key={step.phase} className="process-card">
              <span>{step.phase}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.deliverables.eyebrow} title={page.deliverables.title} body={page.deliverables.body} />
        <div className="deliverable-grid">
          {page.deliverables.items.map((item) => (
            <article key={item.title} className="info-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.faq.eyebrow} title={page.faq.title} body={page.faq.body} center />
        <div className="faq-list">
          {page.faq.items.map((item) => (
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

      <section className="section-block reveal">
        <div className="cta-band">
          <div>
            <p className="eyebrow">{page.cta.eyebrow}</p>
            <h2>{page.cta.title}</h2>
            <p>{page.cta.body}</p>
          </div>
          <a className="btn btn-primary" href={buildPageHref("contact", locale)}>
            {page.cta.primary}
          </a>
        </div>
      </section>
    </>
  );
}

function AboutPage({ t, locale }) {
  const page = t.pages.about;

  return (
    <>
      <PageIntro page={page} locale={locale} t={t} />

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.story.eyebrow} title={page.story.title} body={page.story.body} />
        <div className="story-grid">
          {page.story.points.map((item) => (
            <article key={item.title} className="info-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.principles.eyebrow} title={page.principles.title} body={page.principles.body} />
        <div className="story-grid">
          {page.principles.items.map((item) => (
            <article key={item.title} className="info-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block reveal">
        <div className="coverage-layout">
          <div className="coverage-copy">
            <SectionHeader eyebrow={page.footprint.eyebrow} title={page.footprint.title} body={page.footprint.body} />
            <ul className="coverage-bullets">
              {page.footprint.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <aside className="proof-stack">
            <article className="proof-stack__panel">
              <span>{page.footprint.panel.kicker}</span>
              <h3>{page.footprint.panel.title}</h3>
              <p>{page.footprint.panel.body}</p>
              <div className="inline-logos">
                <img src={adactedLogo} alt="Adacted logo" />
                <img src={mmixLogo} alt="MMIX logo" />
              </div>
              <div className="link-pills">
                {FOOTPRINT_LINKS.map((item) => (
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
        <div className="cta-band">
          <div>
            <p className="eyebrow">{page.cta.eyebrow}</p>
            <h2>{page.cta.title}</h2>
            <p>{page.cta.body}</p>
          </div>
          <a className="btn btn-primary" href={buildPageHref("contact", locale)}>
            {page.cta.primary}
          </a>
        </div>
      </section>
    </>
  );
}

function CasesPage({ t, locale }) {
  const page = t.pages.cases;

  return (
    <>
      <PageIntro page={page} locale={locale} t={t} />

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.cases.eyebrow} title={page.cases.title} body={page.cases.body} />
        <div className="case-grid">
          {page.cases.items.map((item, index) => (
            <article key={item.title} className="case-card">
              <div className="case-media">
                <img src={CASE_MEDIA[index % CASE_MEDIA.length]} alt={item.alt} />
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

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.verticals.eyebrow} title={page.verticals.title} body={page.verticals.body} />
        <div className="story-grid">
          {page.verticals.items.map((item) => (
            <article key={item.title} className="info-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block reveal">
        <div className="cta-band">
          <div>
            <p className="eyebrow">{page.cta.eyebrow}</p>
            <h2>{page.cta.title}</h2>
            <p>{page.cta.body}</p>
          </div>
          <div className="cta-row">
            <a className="btn btn-primary" href={buildPageHref("services", locale)}>
              {page.cta.primary}
            </a>
            <a className="btn btn-ghost" href={buildPageHref("contact", locale)}>
              {page.cta.secondary}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactPage({ t, locale }) {
  const page = t.pages.contact;

  return (
    <>
      <PageIntro page={page} locale={locale} t={t} />

      <section className="contact-panel reveal">
        <div className="contact-copy">
          <p className="eyebrow eyebrow--strong">{page.qualify.eyebrow}</p>
          <h2>{page.qualify.title}</h2>
          <p>{page.qualify.body}</p>

          <ul className="contact-points">
            {page.qualify.points.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="link-pills">
            {FOOTPRINT_LINKS.map((item) => (
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

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.faq.eyebrow} title={page.faq.title} body={page.faq.body} center />
        <div className="faq-list">
          {page.faq.items.map((item) => (
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
    </>
  );
}

function renderPage({ currentPage, t, locale }) {
  if (currentPage === "services") return <ServicesPage t={t} locale={locale} />;
  if (currentPage === "about") return <AboutPage t={t} locale={locale} />;
  if (currentPage === "cases") return <CasesPage t={t} locale={locale} />;
  if (currentPage === "contact") return <ContactPage t={t} locale={locale} />;
  return <HomePage t={t} locale={locale} />;
}

export default function App() {
  const [locale, setLocale] = useState(() => (typeof window === "undefined" ? DEFAULT_LOCALE : resolveInitialLocale()));
  const currentPage = typeof window === "undefined" ? "home" : resolvePageFromPath(window.location.pathname);
  const t = content[locale] || content.en;
  const page = t.pages[currentPage];

  useRevealAnimations();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", locale);
    window.history.replaceState({}, "", url);
    window.localStorage.setItem("locale", locale);
    applySeo({ locale, seo: page.seo, faq: page.faq?.items || [] });
    trackPageView({ locale, page: currentPage });
  }, [locale, currentPage, page]);

  return (
    <>
      <div className="page-orb page-orb--cyan" />
      <div className="page-orb page-orb--rose" />
      <div className="page-grid" />

      <header className="shell topbar reveal">
        <a className="brand" href={buildPageHref("home", locale)} aria-label="Buzztm home">
          <span className="brand-mark">BZ</span>
          <span className="brand-copy">
            <strong>Buzztm</strong>
            <small>{t.brandTag}</small>
          </span>
        </a>

        <nav className="nav" aria-label="Primary">
          {SITE_PAGES.map((item) => (
            <a
              key={item}
              href={buildPageHref(item, locale)}
              className={currentPage === item ? "is-active" : ""}
            >
              {t.nav[item]}
            </a>
          ))}
        </nav>

        <div className="topbar-actions">
          <LocaleSwitcher locale={locale} onChange={setLocale} />
          <a className="btn btn-ghost btn-sm" href={buildPageHref("contact", locale)}>
            {t.cta.primary}
          </a>
        </div>
      </header>

      <main className="shell site-main">{renderPage({ currentPage, t, locale })}</main>

      <footer className="site-footer">
        <div className="shell footer-wrap">
          <div>
            <strong>Buzztm</strong>
            <p>{t.footer.note}</p>
          </div>

          <div className="footer-links">
            {SITE_PAGES.map((item) => (
              <a key={item} href={buildPageHref(item, locale)}>
                {t.nav[item]}
              </a>
            ))}
          </div>

          <div className="footer-copy">{t.footer.copy}</div>
        </div>
      </footer>
    </>
  );
}
