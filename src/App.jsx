import { useEffect, useState } from "react";
import adactedLogo from "../assets/real/adacted-logo.png";
import buzztmLive from "../assets/real/buzztm-live.webp";
import mmixLogo from "../assets/real/mmix-logo.png";
import caseEcom from "../assets/stitch/case-ecom.webp";
import caseInfobiz from "../assets/stitch/case-infobiz.webp";
import caseService from "../assets/stitch/case-service.webp";
import heroCollage from "../assets/stitch/hero-collage.webp";
import { initAnalytics, trackEvent, trackPageView } from "./analytics";
import { DEFAULT_LOCALE, loadLocaleContent, resolveInitialLocale, SUPPORTED_LOCALES } from "./content";
import { applySeo } from "./seo";
import {
  NAV_PAGES,
  buildBlogPostHref,
  buildGeoHref,
  buildPageHref,
  buildServiceHref,
  resolveRoute
} from "./site";

const CASE_MEDIA = [caseEcom, caseInfobiz, caseService];

const FOOTPRINT_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/adactedagency/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/73956025" },
  { label: "Facebook", href: "https://www.facebook.com/Adacted-102016908383521" },
  { label: "MMIX article", href: "https://mmix.ua/en/nastrojka-reklamyi-v-tiktok/" }
];

const SERVICE_MEDIA = {
  signalSprint: caseInfobiz,
  launchBurst: heroCollage,
  multiGeoScale: caseService,
  ugcProduction: caseInfobiz,
  creatorWhitelisting: buzztmLive,
  tiktokShopLaunch: caseEcom,
  landingLocalization: caseEcom,
  leadGenFunnels: heroCollage,
  retargetingRecovery: caseService,
  analyticsAttribution: buzztmLive,
  creativeStrategy: heroCollage,
  sparkAdsOps: buzztmLive,
  communitySeeding: caseInfobiz
};

const BLOG_MEDIA = {
  creativeTesting: caseInfobiz,
  landingSystems: caseEcom,
  launchSequencing: caseService
};

const GEO_MEDIA = {
  uae: heroCollage,
  saudiArabia: caseService,
  germany: caseEcom,
  poland: caseInfobiz,
  kazakhstan: buzztmLive,
  romania: caseService
};

const ARTICLE_LINK_LABEL = {
  en: "Read article",
  ru: "Открыть статью"
};

const LOCALE_SHORT_LABEL = {
  en: "EN",
  ru: "RU"
};

const POST_SERVICE_MAP = {
  creativeTesting: "signalSprint",
  landingSystems: "launchBurst",
  launchSequencing: "multiGeoScale"
};

const MENU_KEYS = new Set(["services", "blog"]);
const DEFAULT_FORM_ENDPOINT = "/api/lead";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path
        d="M4.75 10.25 12 4.5l7.25 5.75v8.25a1 1 0 0 1-1 1H5.75a1 1 0 0 1-1-1zm4.5 9.25h5.5v-5.75a1 1 0 0 0-1-1h-3.5a1 1 0 0 0-1 1z"
        fill="currentColor"
      />
    </svg>
  );
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
          {LOCALE_SHORT_LABEL[code] || code.toUpperCase()}
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

function SmartImage({ priority = false, ...props }) {
  return (
    <img
      {...props}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}

function buildMenuGroups(t, locale) {
  return {
    services: t.pages.services.packages.items.map((item) => ({
      href: buildServiceHref(item.key, locale),
      label: item.title,
      meta: item.label
    })),
    blog: t.pages.blog.posts.items.map((item) => ({
      href: buildBlogPostHref(item.key, locale),
      label: item.title,
      meta: item.category
    }))
  };
}

function buildBreadcrumbs({ route, t, routeContent, locale }) {
  const breadcrumbs = [
    { name: t.nav.home, path: buildPageHref("home", locale) }
  ];

  if (route.kind === "page") {
    if (route.key !== "home") {
      breadcrumbs.push({ name: t.nav[route.key], path: buildPageHref(route.key, locale) });
    }
    return breadcrumbs;
  }

  if (route.kind === "service") {
    breadcrumbs.push({ name: t.nav.services, path: buildPageHref("services", locale) });
    breadcrumbs.push({ name: routeContent.hero.title, path: buildServiceHref(route.key, locale) });
    return breadcrumbs;
  }

  if (route.kind === "geo") {
    breadcrumbs.push({ name: t.nav.services, path: buildPageHref("services", locale) });
    breadcrumbs.push({ name: routeContent.hero.title, path: buildGeoHref(route.key, locale) });
    return breadcrumbs;
  }

  breadcrumbs.push({ name: t.nav.blog, path: buildPageHref("blog", locale) });
  breadcrumbs.push({ name: routeContent.title, path: buildBlogPostHref(route.key, locale) });
  return breadcrumbs;
}

function NavLinkGroup({ item, label, href, active, entries, openMenu, onToggle, onClose }) {
  const isOpen = openMenu === item;

  return (
    <div
      className={`nav-item${isOpen ? " is-open" : ""}`}
      onMouseEnter={() => onToggle(item)}
      onMouseLeave={onClose}
    >
      <div className="nav-link-row">
        <a href={href} className={active ? "is-active" : ""} onClick={onClose}>
          {label}
        </a>
        <button
          type="button"
          className={`nav-caret${isOpen ? " is-open" : ""}`}
          aria-label={`${label} menu`}
          aria-expanded={isOpen}
          onClick={() => onToggle(isOpen ? null : item)}
        >
          <span />
        </button>
      </div>

      <div className="nav-dropdown">
        {entries.map((entry) => (
          <a key={entry.href} href={entry.href} className="nav-dropdown__link" onClick={onClose}>
            <span>{entry.label}</span>
            <small>{entry.meta}</small>
          </a>
        ))}
      </div>
    </div>
  );
}

function PageIntro({ page, locale }) {
  return (
    <section className="hero-panel hero-panel--inner reveal">
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
          <SmartImage
            src={page.intro.image === "live" ? buzztmLive : heroCollage}
            alt={page.intro.imageAlt}
            priority
          />
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
            <SmartImage src={adactedLogo} alt="Adacted logo" />
            <SmartImage src={mmixLogo} alt="MMIX logo" />
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
  const endpoint = import.meta.env.VITE_FORM_ENDPOINT || DEFAULT_FORM_ENDPOINT;
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

function LeadForm({ locale, t, compact = false }) {
  const [status, setStatus] = useState("idle");
  const liveMode = Boolean(import.meta.env.VITE_FORM_ENDPOINT || DEFAULT_FORM_ENDPOINT);

  function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");
    trackEvent("form_submit", { form_name: compact ? "hero_form" : "lead_form", locale });

    submitLeadForm(event.currentTarget, locale)
      .then((result) => {
        if (!result.ok) throw new Error("submit_failed");
        setStatus("success");
        trackEvent("generate_lead", {
          form_name: compact ? "hero_form" : "lead_form",
          locale,
          mode: liveMode ? "live" : "demo"
        });
        event.currentTarget.reset();
      })
      .catch(() => {
        setStatus("error");
        trackEvent("form_error", { form_name: compact ? "hero_form" : "lead_form", locale });
      });
  }

  return (
    <form className={`lead-form${compact ? " lead-form--compact" : ""}${status === "success" ? " submitted" : ""}`} onSubmit={handleSubmit} noValidate>
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
          <textarea name="message" rows={compact ? 4 : 5} placeholder={t.form.placeholders.message} />
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
      <section className="hero-panel hero-panel--home reveal">
        <div className="hero-copy">
          <p className="eyebrow eyebrow--strong">{page.hero.eyebrow}</p>
          <h1>{page.hero.title}</h1>
          <p className="hero-lede">{page.hero.body}</p>

          <div className="cta-row">
            {page.hero.actions.map((item, index) => (
              <a
                key={item.page}
                className={`btn ${index === 0 ? "btn-primary" : "btn-ghost"}`}
                href={buildPageHref(item.page, locale)}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hero-stats">
            {page.hero.metrics.map((item) => (
              <div key={item.label} className="stat-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <ul className="tag-row">
            {page.hero.form.points.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="hero-visual hero-visual--home">
          <article className="hero-image-card hero-image-card--home">
            <SmartImage src={heroCollage} alt={page.hero.imageAlt} priority />
            <div className="hero-image-overlay">
              <span>{page.hero.overlay.kicker}</span>
              <strong>{page.hero.overlay.title}</strong>
              <p>{page.hero.overlay.body}</p>
            </div>
          </article>

          <article className="floating-card floating-card--proof">
            <span>{page.hero.aside.kicker}</span>
            <strong>{page.hero.aside.title}</strong>
            <p>{page.hero.aside.body}</p>
          </article>

          <article className="floating-card floating-card--ops">
            <div className="logo-stack" aria-label="Partner footprint">
              <SmartImage src={adactedLogo} alt="Adacted logo" />
              <SmartImage src={mmixLogo} alt="MMIX logo" />
            </div>
            <span>{page.hero.footprint.kicker}</span>
            <strong>{page.hero.footprint.title}</strong>
            <p>{page.hero.footprint.body}</p>
          </article>

          <article className="hero-form-card">
            <p className="eyebrow">{page.hero.form.eyebrow}</p>
            <h2>{page.hero.form.title}</h2>
            <p>{page.hero.form.body}</p>
            <LeadForm locale={locale} t={t} compact />
          </article>
        </div>
      </section>

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.pain.eyebrow} title={page.pain.title} body={page.pain.body} center />
        <div className="pain-grid pain-grid--four">
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
        <SectionHeader eyebrow={page.services.eyebrow} title={page.services.title} body={page.services.body} />
        <div className="service-grid">
          {page.services.items.map((item) => (
            <article key={item.key} className="service-card">
              <span className="service-label">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <a className="text-link" href={buildServiceHref(item.key, locale)}>
                {item.link}
              </a>
            </article>
          ))}
        </div>
      </section>

      {page.serviceCluster?.items?.length ? (
        <section className="section-block reveal">
          <SectionHeader
            eyebrow={page.serviceCluster.eyebrow}
            title={page.serviceCluster.title}
            body={page.serviceCluster.body}
          />
          <div className="service-grid">
            {page.serviceCluster.items.map((item) => (
              <article key={item.key} className="service-card">
                <span className="service-label">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <a className="text-link" href={buildServiceHref(item.key, locale)}>
                  {item.link}
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {page.geoCluster?.items?.length ? (
        <section className="section-block reveal">
          <SectionHeader eyebrow={page.geoCluster.eyebrow} title={page.geoCluster.title} body={page.geoCluster.body} />
          <div className="story-grid">
            {page.geoCluster.items.map((item) => (
              <article key={item.key} className="info-card">
                <span className="service-label">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <a className="text-link" href={buildGeoHref(item.key, locale)}>
                  {item.link}
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-block reveal">
        <div className="coverage-layout">
          <div className="coverage-copy">
            <SectionHeader eyebrow={page.proof.eyebrow} title={page.proof.title} body={page.proof.body} />
            <ul className="coverage-bullets">
              {page.proof.points.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <aside className="proof-stack">
            <article className="proof-stack__shot">
              <SmartImage src={buzztmLive} alt="Buzztm public website screenshot" />
            </article>
            <article className="proof-stack__panel">
              <span>{page.hero.footprint.kicker}</span>
              <h3>{page.hero.footprint.title}</h3>
              <p>{page.hero.footprint.body}</p>
              <div className="inline-logos">
                <SmartImage src={adactedLogo} alt="Adacted logo" />
                <SmartImage src={mmixLogo} alt="MMIX logo" />
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
        <SectionHeader eyebrow={page.blog.eyebrow} title={page.blog.title} body={page.blog.body} />
        <div className="blog-grid">
          {page.blog.items.map((item) => (
            <article key={item.key} className="blog-card">
              <span className="blog-card__category">{item.category}</span>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
              <a className="text-link" href={buildBlogPostHref(item.key, locale)}>
                {page.blog.cta}
              </a>
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
      <PageIntro page={page} locale={locale} />

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.packages.eyebrow} title={page.packages.title} body={page.packages.body} />
        <div className="service-grid">
          {page.packages.items.map((item) => (
            <article key={item.key} className={`service-card${item.featured ? " service-card--featured" : ""}`}>
              <span className="service-label">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <ul>
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <a className="text-link" href={buildServiceHref(item.key, locale)}>
                {item.link}
              </a>
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

      {page.marketCoverage?.items?.length ? (
        <section className="section-block reveal">
          <SectionHeader
            eyebrow={page.marketCoverage.eyebrow}
            title={page.marketCoverage.title}
            body={page.marketCoverage.body}
          />
          <div className="story-grid">
            {page.marketCoverage.items.map((item) => (
              <article key={item.key} className="info-card">
                <span className="service-label">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <a className="text-link" href={buildGeoHref(item.key, locale)}>
                  {item.link}
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

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

function ServiceDetailPage({ service, locale, routeKey, contactLabel }) {
  return (
    <>
      <section className="detail-hero reveal">
        <div className="detail-hero__copy">
          <p className="eyebrow eyebrow--strong">{service.hero.eyebrow}</p>
          <h1>{service.hero.title}</h1>
          <p className="hero-lede">{service.hero.body}</p>

          <div className="hero-stats">
            {service.hero.stats.map((item) => (
              <div key={item.label} className="stat-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="detail-summary-card">
          <SmartImage src={SERVICE_MEDIA[routeKey] || SERVICE_MEDIA.launchBurst} alt={service.hero.title} priority />
          <div className="detail-summary-card__body">
            <h3>{service.hero.title}</h3>
            <ul className="coverage-bullets">
              {service.hero.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <a className="btn btn-primary" href={buildPageHref("contact", locale)}>
              {contactLabel}
            </a>
          </div>
        </aside>
      </section>

      <section className="section-block reveal">
        <SectionHeader eyebrow={service.outcomes.eyebrow} title={service.outcomes.title} body={service.outcomes.body} />
        <div className="story-grid">
          {service.outcomes.items.map((item) => (
            <article key={item.title} className="info-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block reveal">
        <SectionHeader eyebrow={service.scope.eyebrow} title={service.scope.title} body={service.scope.body} />
        <div className="detail-list-card">
          <ul className="coverage-bullets">
            {service.scope.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-block reveal">
        <SectionHeader eyebrow={service.fit.eyebrow} title={service.fit.title} body={service.fit.body} />
        <div className="story-grid">
          {service.fit.items.map((item) => (
            <article key={item.title} className="info-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {service.relatedMarkets?.length ? (
        <section className="section-block reveal">
          <SectionHeader
            eyebrow={service.marketCoverage.eyebrow}
            title={service.marketCoverage.title}
            body={service.marketCoverage.body}
          />
          <div className="story-grid">
            {service.relatedMarkets.map((item) => (
              <article key={item.key} className="info-card">
                <span className="service-label">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <a className="text-link" href={buildGeoHref(item.key, locale)}>
                  {item.link}
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {service.faq?.items?.length ? (
        <section className="section-block reveal">
          <SectionHeader eyebrow={service.faq.eyebrow} title={service.faq.title} body={service.faq.body} center />
          <div className="faq-list">
            {service.faq.items.map((item) => (
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
      ) : null}

      <section className="section-block reveal">
        <div className="cta-band">
          <div>
            <p className="eyebrow">{service.cta.eyebrow}</p>
            <h2>{service.cta.title}</h2>
            <p>{service.cta.body}</p>
          </div>
          <a className="btn btn-primary" href={buildPageHref("contact", locale)}>
            {service.cta.primary}
          </a>
        </div>
      </section>
    </>
  );
}

function GeoDetailPage({ geo, locale }) {
  return (
    <>
      <section className="detail-hero reveal">
        <div className="detail-hero__copy">
          <p className="eyebrow eyebrow--strong">{geo.hero.eyebrow}</p>
          <h1>{geo.hero.title}</h1>
          <p className="hero-lede">{geo.hero.body}</p>

          <div className="hero-stats">
            {geo.hero.stats.map((item) => (
              <div key={item.label} className="stat-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="detail-summary-card">
          <SmartImage src={GEO_MEDIA[geo.key] || heroCollage} alt={geo.hero.title} priority />
          <div className="detail-summary-card__body">
            <h3>{geo.marketPanel.title}</h3>
            <ul className="coverage-bullets">
              {geo.marketPanel.points.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <a className="btn btn-primary" href={buildPageHref("contact", locale)}>
              {geo.cta.primary}
            </a>
          </div>
        </aside>
      </section>

      <section className="section-block reveal">
        <SectionHeader eyebrow={geo.searchIntent.eyebrow} title={geo.searchIntent.title} body={geo.searchIntent.body} />
        <div className="story-grid">
          {geo.searchIntent.items.map((item) => (
            <article key={item.title} className="info-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block reveal">
        <SectionHeader eyebrow={geo.services.eyebrow} title={geo.services.title} body={geo.services.body} />
        <div className="service-grid">
          {geo.services.items.map((item) => (
            <article key={item.key} className="service-card">
              <span className="service-label">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <a className="text-link" href={buildServiceHref(item.key, locale)}>
                {item.link}
              </a>
            </article>
          ))}
        </div>
      </section>

      {geo.faq?.items?.length ? (
        <section className="section-block reveal">
          <SectionHeader eyebrow={geo.faq.eyebrow} title={geo.faq.title} body={geo.faq.body} center />
          <div className="faq-list">
            {geo.faq.items.map((item) => (
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
      ) : null}

      <section className="section-block reveal">
        <div className="cta-band">
          <div>
            <p className="eyebrow">{geo.cta.eyebrow}</p>
            <h2>{geo.cta.title}</h2>
            <p>{geo.cta.body}</p>
          </div>
          <a className="btn btn-primary" href={buildPageHref("contact", locale)}>
            {geo.cta.primary}
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
      <PageIntro page={page} locale={locale} />

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
                <SmartImage src={adactedLogo} alt="Adacted logo" />
                <SmartImage src={mmixLogo} alt="MMIX logo" />
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
      <PageIntro page={page} locale={locale} />

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.cases.eyebrow} title={page.cases.title} body={page.cases.body} />
        <div className="case-grid">
          {page.cases.items.map((item, index) => (
            <article key={item.title} className="case-card">
              <div className="case-media">
                <SmartImage src={CASE_MEDIA[index % CASE_MEDIA.length]} alt={item.alt} />
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

function BlogPage({ t, locale }) {
  const page = t.pages.blog;
  const articleLinkLabel = ARTICLE_LINK_LABEL[locale] || ARTICLE_LINK_LABEL.en;

  return (
    <>
      <PageIntro page={page} locale={locale} />

      <section className="section-block reveal">
        <div className="featured-article">
          <div className="featured-article__copy">
            <p className="eyebrow">{page.featured.eyebrow}</p>
            <h2>{page.featured.title}</h2>
            <p>{page.featured.body}</p>
            <a className="btn btn-primary" href={buildBlogPostHref(page.featured.key, locale)}>
              {page.featured.cta}
            </a>
          </div>
          <div className="featured-article__media">
            <SmartImage src={BLOG_MEDIA[page.featured.key]} alt={page.featured.title} />
          </div>
        </div>
      </section>

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.posts.eyebrow} title={page.posts.title} body={page.posts.body} />
        <div className="blog-grid">
          {page.posts.items.map((item) => (
            <article key={item.key} className="blog-card">
              <div className="blog-card__media">
                <SmartImage src={BLOG_MEDIA[item.key]} alt={item.title} />
              </div>
              <div className="blog-card__body">
                <div className="blog-card__meta">
                  <span>{item.category}</span>
                  <span>{item.readTime}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
                <a className="text-link" href={buildBlogPostHref(item.key, locale)}>
                  {articleLinkLabel}
                </a>
              </div>
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
          <a className="btn btn-primary" href={buildPageHref("contact", locale)}>
            {page.cta.primary}
          </a>
        </div>
      </section>
    </>
  );
}

function BlogPostPage({ post, locale, routeKey }) {
  const serviceKey = POST_SERVICE_MAP[routeKey];
  const ctaHref = serviceKey ? buildServiceHref(serviceKey, locale) : buildPageHref("contact", locale);

  return (
    <>
      <section className="article-hero reveal">
        <p className="eyebrow eyebrow--strong">{post.meta.category}</p>
        <h1>{post.title}</h1>
        <p className="hero-lede">{post.lede}</p>
        <div className="article-meta">
          <span>{post.meta.readTime}</span>
          <span>{post.meta.published}</span>
        </div>
      </section>

      <section className="article-shell reveal">
        <aside className="article-sidebar">
          <article className="article-sidebar__card">
            <SmartImage src={BLOG_MEDIA[routeKey] || BLOG_MEDIA.creativeTesting} alt={post.title} priority />
            <div>
              <p className="eyebrow">{post.cta.eyebrow}</p>
              <h3>{post.cta.title}</h3>
              <p>{post.cta.body}</p>
              <a className="btn btn-primary" href={ctaHref}>
                {post.cta.primary}
              </a>
            </div>
          </article>
        </aside>

        <article className="article-body">
          {post.sections.map((section) => (
            <section key={section.title} className="article-section">
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets?.length ? (
                <ul className="coverage-bullets">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>
      </section>
    </>
  );
}

function ContactPage({ t, locale }) {
  const page = t.pages.contact;

  return (
    <>
      <section className="contact-hero reveal">
        <div className="contact-copy">
          <p className="eyebrow eyebrow--strong">{page.hero.eyebrow}</p>
          <h1>{page.hero.title}</h1>
          <p className="hero-lede">{page.hero.body}</p>

          <ul className="contact-points">
            {page.hero.points.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="trust-row">
            {page.hero.trust.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <div className="link-pills">
            {FOOTPRINT_LINKS.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="contact-form-wrap contact-form-wrap--hero">
          <LeadForm locale={locale} t={t} />
        </div>
      </section>

      <section className="section-block reveal">
        <SectionHeader eyebrow={page.qualify.eyebrow} title={page.qualify.title} body={page.qualify.body} />
        <div className="detail-list-card">
          <ul className="coverage-bullets">
            {page.qualify.points.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
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

function getRouteContent(t, route) {
  if (route.kind === "page") return t.pages[route.key];
  if (route.kind === "service") return t.serviceDetails[route.key];
  if (route.kind === "geo") return t.geoDetails[route.key];
  return t.blogPosts[route.key];
}

function renderRoute({ route, t, locale }) {
  if (route.kind === "service") {
    return (
      <ServiceDetailPage
        service={t.serviceDetails[route.key]}
        locale={locale}
        routeKey={route.key}
        contactLabel={t.cta.primary}
      />
    );
  }

  if (route.kind === "geo") {
    return <GeoDetailPage geo={t.geoDetails[route.key]} locale={locale} />;
  }

  if (route.kind === "post") {
    return <BlogPostPage post={t.blogPosts[route.key]} locale={locale} routeKey={route.key} />;
  }

  if (route.key === "services") return <ServicesPage t={t} locale={locale} />;
  if (route.key === "about") return <AboutPage t={t} locale={locale} />;
  if (route.key === "cases") return <CasesPage t={t} locale={locale} />;
  if (route.key === "blog") return <BlogPage t={t} locale={locale} />;
  if (route.key === "contact") return <ContactPage t={t} locale={locale} />;
  return <HomePage t={t} locale={locale} />;
}

export default function App({ initialLocale = DEFAULT_LOCALE, initialContent }) {
  const [locale, setLocale] = useState(initialLocale);
  const [loadedContent, setLoadedContent] = useState(() =>
    initialContent ? { [initialLocale]: initialContent } : {}
  );
  const [openMenu, setOpenMenu] = useState(null);
  const route = typeof window === "undefined" ? resolveRoute("/") : resolveRoute(window.location.pathname);
  const t = loadedContent[locale] || loadedContent[initialLocale];
  const routeContent = getRouteContent(t, route);
  const faqItems = routeContent.faq?.items || [];
  const menuGroups = buildMenuGroups(t, locale);
  const breadcrumbs = buildBreadcrumbs({ route, t, routeContent, locale });
  const articleMeta =
    route.kind === "post"
      ? {
          headline: routeContent.title,
          description: routeContent.lede,
          datePublished: routeContent.meta.published
        }
      : null;

  useRevealAnimations();

  useEffect(() => {
    if (loadedContent[locale]) return;

    let cancelled = false;

    loadLocaleContent(locale).then((nextContent) => {
      if (cancelled) return;
      setLoadedContent((current) => {
        if (current[locale]) return current;
        return { ...current, [locale]: nextContent };
      });
    });

    return () => {
      cancelled = true;
    };
  }, [loadedContent, locale]);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!loadedContent[locale]) return;

    const url = new URL(window.location.href);
    url.searchParams.set("lang", locale);
    window.history.replaceState({}, "", url);
    window.localStorage.setItem("locale", locale);
    applySeo({
      locale,
      seo: routeContent.seo,
      faq: faqItems,
      article: articleMeta,
      pathname: route.path,
      breadcrumbs,
      routeKind: route.kind,
      entity: routeContent
    });
    trackPageView({ locale, page: route.navKey, route_kind: route.kind });
  }, [locale, route.key, route.kind, route.navKey, route.path, routeContent, faqItems, articleMeta, breadcrumbs]);

  useEffect(() => {
    setOpenMenu(null);
  }, [route.key, route.kind, locale]);

  if (!t) return null;

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
          {NAV_PAGES.map((item) => {
            const href = buildPageHref(item, locale);

            if (!MENU_KEYS.has(item)) {
              const isHome = item === "home";
              return (
                <a
                  key={item}
                  href={href}
                  className={`${route.navKey === item ? "is-active" : ""}${isHome ? " nav-home-link" : ""}`}
                  aria-label={isHome ? t.nav[item] : undefined}
                  onClick={() => setOpenMenu(null)}
                >
                  {isHome ? (
                    <>
                      <span className="nav-home-icon">
                        <HomeIcon />
                      </span>
                      <span className="sr-only">{t.nav[item]}</span>
                    </>
                  ) : (
                    t.nav[item]
                  )}
                </a>
              );
            }

            return (
              <NavLinkGroup
                key={item}
                item={item}
                label={t.nav[item]}
                href={href}
                active={route.navKey === item}
                entries={menuGroups[item]}
                openMenu={openMenu}
                onToggle={setOpenMenu}
                onClose={() => setOpenMenu(null)}
              />
            );
          })}
        </nav>

        <div className="topbar-actions">
          <LocaleSwitcher locale={locale} onChange={setLocale} />
          <a className="btn btn-ghost btn-sm" href={buildPageHref("contact", locale)}>
            {t.cta.primary}
          </a>
        </div>
      </header>

      <main className="shell site-main">{renderRoute({ route, t, locale })}</main>

      <footer className="site-footer">
        <div className="shell footer-wrap">
          <div>
            <strong>Buzztm</strong>
            <p>{t.footer.note}</p>
          </div>

          <div className="footer-links">
            {NAV_PAGES.map((item) => (
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
