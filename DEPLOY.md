# Cloudflare Pages Deployment

`buzztm-site` can deploy to Cloudflare Pages and optionally sync DNS either through Cloudflare or Namecheap.

## What the workflow does

1. Runs `npm ci`, `npm test`, and `npm run build`.
2. Ensures the Pages project exists with the expected build settings.
3. Uploads `dist/` to Cloudflare Pages.
4. Uploads `functions/` as Cloudflare Pages Functions for the live lead intake endpoint.
5. On `main`, attaches the configured custom domains.
6. Optionally syncs DNS records in Cloudflare or Namecheap.

## Required secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

If DNS remains on Namecheap, also provide:

- `NAMECHEAP_API_USER`
- `NAMECHEAP_USERNAME`
- `NAMECHEAP_API_KEY`
- `NAMECHEAP_CLIENT_IP`

## Key repository variables

- `CLOUDFLARE_PAGES_PROJECT`
  Recommended: `buzztm`
- `CLOUDFLARE_PAGES_DOMAINS`
  Example: `buzztm.com,www.buzztm.com`
- `DNS_PROVIDER`
  `cloudflare` or `namecheap`
- `CLOUDFLARE_ZONE_ID`
  Needed only for Cloudflare DNS sync
- `VITE_SITE_URL`
  Example: `https://www.buzztm.com`
- `VITE_GTM_ID`
  Recommended when routing Google measurement through Tag Manager. Example: `GTM-PJCKMKNR`
- `VITE_GA_ID`
  Optional direct GA4 fallback when GTM is not used. Example: `G-XXXXXXXXXX`
- `N8N_FORM_WEBHOOK_URL`
  Cloudflare Pages runtime env for the private lead-intake webhook used by `/api/lead`
- `NAMECHEAP_DOMAIN`
  Example: `buzztm.com`

## Local commands

```bash
npm run cf:pages:ensure
npm run cf:pages:domains
npm run namecheap:dns:sync
```

## Namecheap mode

When `DNS_PROVIDER=namecheap`:

- apex hosts are managed as `ALIAS -> <project>.pages.dev`
- subdomains like `www` are managed as `CNAME -> <project>.pages.dev`
- existing mail and verification records are preserved
- nameservers are not switched automatically

## Suggested Buzztm production values

```bash
export CLOUDFLARE_PAGES_PROJECT=buzztm
export CLOUDFLARE_PAGES_DOMAINS=www.buzztm.com
export VITE_SITE_URL=https://www.buzztm.com
export VITE_GTM_ID=GTM-PJCKMKNR
export DNS_PROVIDER=namecheap
export NAMECHEAP_DOMAIN=buzztm.com
```
