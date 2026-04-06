import fs from "node:fs";
import path from "node:path";

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    out[key] = val;
  }
  return out;
}

const localEnv = readEnv(path.resolve(".env"));
const exampleEnv = readEnv(path.resolve(".env.example"));
const siteUrl = (process.env.VITE_SITE_URL || localEnv.VITE_SITE_URL || exampleEnv.VITE_SITE_URL || "https://example.com").replace(/\/$/, "");
const publicDir = path.resolve("public");
fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  `  <url>\n` +
  `    <loc>${siteUrl}/</loc>\n` +
  `    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/?lang=en" />\n` +
  `    <xhtml:link rel="alternate" hreflang="ru" href="${siteUrl}/?lang=ru" />\n` +
  `    <xhtml:link rel="alternate" hreflang="uk" href="${siteUrl}/?lang=uk" />\n` +
  `    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/?lang=en" />\n` +
  `    <changefreq>weekly</changefreq>\n` +
  `    <priority>1.0</priority>\n` +
  `  </url>\n` +
  `  <url>\n` +
  `    <loc>${siteUrl}/thank-you.html</loc>\n` +
  `    <changefreq>monthly</changefreq>\n` +
  `    <priority>0.3</priority>\n` +
  `  </url>\n` +
  `</urlset>\n`;

fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemap);
console.log("Generated robots.txt and sitemap.xml for", siteUrl);
