// Post-build step: turns the single SPA shell (dist/index.html) into one
// static HTML file per template in src/data/templates.json, so crawlers that
// don't run JavaScript still see each page's own <title>, meta description,
// canonical, OG tags, JSON-LD and visible H1/intro/FAQ text.
//
//   dist/index.html              -> https://hashplayground.in/billflow/
//   dist/<slug>/index.html       -> https://hashplayground.in/billflow/<slug>/
//   dist/sitemap.xml             -> https://hashplayground.in/billflow/sitemap.xml
//
// Static hosting serves these real files before the SPA rewrite kicks in.
// React then mounts with createRoot, replacing the static #root content.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const data = JSON.parse(readFileSync(join(root, 'src/data/templates.json'), 'utf8'))
const shell = readFileSync(join(dist, 'index.html'), 'utf8')

const HEAD_PATTERN = /<!-- seo:start[\s\S]*?<!-- seo:end -->/
const BODY_MARKER = '<!-- seo:body -->'
if (!HEAD_PATTERN.test(shell) || !shell.includes(BODY_MARKER)) {
  throw new Error('prerender: seo markers missing from dist/index.html')
}

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// JSON inside <script> must not be able to close the tag.
const jsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c')

const pageUrl = (slug) => `${data.siteOrigin}${data.basePath}${slug ? `${slug}/` : ''}`
const gallery = data.galleryPage
// 1200x630 social cards (JPEG, ~120 KB: WhatsApp skips previews over ~300 KB):
// a global one, and a GST/UPI one for the India-specific pages.
const ogImageFor = (page) => `${data.siteOrigin}${data.basePath}${page.region === 'IN' ? 'og-billflow-in.jpg' : 'og-billflow.jpg'}`
// Country pages say which English they're written for; the rest are global.
const LOCALES = { IN: 'en_IN', GB: 'en_GB', AU: 'en_AU', AE: 'en_AE' }
const localeFor = (page) => LOCALES[page.region] ?? 'en_US'
const logoUrl = `${data.siteOrigin}${data.basePath}billflow-logo.png`

// Breadcrumb trail as schema.org BreadcrumbList
const breadcrumbs = (trail) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, url], index) => ({ '@type': 'ListItem', position: index + 1, name, item: url })),
})

function head(template, extraStructured = []) {
  const url = pageUrl(template.slug)
  const title = escapeHtml(template.metaTitle)
  const description = escapeHtml(template.metaDescription)
  const ogImage = ogImageFor(template)
  const structured = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'BillFlow',
      url,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any (browser-based)',
      description: template.metaDescription,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    ...(template.faq?.length
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: template.faq.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          },
        ]
      : []),
    ...extraStructured,
  ]
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    '<meta name="robots" content="index, follow" />',
    `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="BillFlow" />',
    `<meta property="og:locale" content="${localeFor(template)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    '<meta property="og:image:type" content="image/jpeg" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:image:alt" content="BillFlow: free invoice generator with VAT, GST or sales tax and PDF download" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    ...structured.map((entry) => `<script type="application/ld+json">${jsonLd(entry)}</script>`),
  ].join('\n    ')
}

// Plain inline-styled markup: it shows only until the JS bundle mounts (and
// to non-JS crawlers), so it must not depend on Tailwind classes.
function body(template) {
  const links = data.templates
    .filter((other) => other.slug !== template.slug)
    .map((other) => `<li><a href="${pageUrl(other.slug)}">${escapeHtml(other.h1)}</a></li>`)
    .join('')
  const faq = template.faq
    .map((item) => `<h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p>`)
    .join('')
  const guide = (template.guide ?? [])
    .map(
      (section) =>
        `<h2>${escapeHtml(section.h)}</h2>${section.p.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}${
          section.list?.length ? `<ul>${section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''
        }`,
    )
    .join('')
  return `<div class="bf-seo" style="max-width:960px;margin:0 auto;padding:32px 16px;font-family:system-ui,sans-serif">
      <p><a href="${pageUrl('')}">BillFlow</a></p>
      <h1>${escapeHtml(template.h1)}</h1>
      <p>${escapeHtml(template.intro)}</p>
      ${template.highlights?.length ? `<h2>What this template includes</h2><ul>${template.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
      <p>Loading the invoice generator…</p>
      ${guide}
      <h2>Frequently asked questions</h2>${faq}
      <h2><a href="${pageUrl(gallery.slug)}">Free invoice templates</a></h2><ul>${links}</ul>
    </div>`
}

function templateList() {
  return data.templates
    .map(
      (template) =>
        `<li><h3><a href="${pageUrl(template.slug)}">${escapeHtml(template.label)}</a></h3><p>${escapeHtml(template.intro)}</p></li>`,
    )
    .join('')
}

function galleryBody() {
  const cards = templateList()
  return `<div class="bf-seo" style="max-width:960px;margin:0 auto;padding:32px 16px;font-family:system-ui,sans-serif">
      <p><a href="${pageUrl('')}">BillFlow</a></p>
      <h1>${escapeHtml(gallery.h1)}</h1>
      <p>${escapeHtml(gallery.intro)}</p>
      <ul>${cards}</ul>
    </div>`
}

// The /billflow/ landing page.
const landing = data.landingPage
const generator = data.templates.find((template) => template.slug === 'invoice-generator')

function landingBody() {
  const faq = landing.faq.map((item) => `<h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p>`).join('')
  return `<div class="bf-seo" style="max-width:960px;margin:0 auto;padding:32px 16px;font-family:system-ui,sans-serif">
      <p><a href="${pageUrl('')}">BillFlow</a></p>
      <h1>${escapeHtml(landing.h1)}</h1>
      <p>${escapeHtml(landing.intro)}</p>
      <p><a href="${pageUrl(generator.slug)}">Create an invoice, free</a> · <a href="${pageUrl(gallery.slug)}">Browse templates</a></p>
      <h2>Invoice templates</h2><ul>${templateList()}</ul>
      <h2>Frequently asked questions</h2>${faq}
    </div>`
}

writeFileSync(
  join(dist, 'index.html'),
  shell
    .replace(HEAD_PATTERN, () =>
      head(landing, [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'BillFlow',
          url: pageUrl(''),
          logo: logoUrl,
          parentOrganization: { '@type': 'Organization', name: 'Hash Playground', url: `${data.siteOrigin}/` },
        },
        { '@context': 'https://schema.org', '@type': 'WebSite', name: 'BillFlow', url: pageUrl('') },
      ]),
    )
    .replace(BODY_MARKER, () => landingBody()),
)

for (const template of data.templates) {
  const html = shell
    .replace(HEAD_PATTERN, () =>
      head(template, [
        breadcrumbs([
          ['BillFlow', pageUrl('')],
          ['Templates', pageUrl(gallery.slug)],
          [template.label, pageUrl(template.slug)],
        ]),
      ]),
    )
    .replace(BODY_MARKER, () => body(template))
  const outFile = join(dist, template.slug, 'index.html')
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, html)
}

// The /billflow/templates/ gallery, with an ItemList of every template.
const itemList = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: data.templates.map((template, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: template.label,
    url: pageUrl(template.slug),
  })),
}
const galleryFile = join(dist, gallery.slug, 'index.html')
mkdirSync(dirname(galleryFile), { recursive: true })
writeFileSync(
  galleryFile,
  shell
    .replace(HEAD_PATTERN, () =>
      head(gallery, [itemList, breadcrumbs([['BillFlow', pageUrl('')], ['Templates', pageUrl(gallery.slug)]])]),
    )
    .replace(BODY_MARKER, () => galleryBody()),
)

const sitemapPages = [landing, gallery, ...data.templates]
const priority = (page) => (page === landing ? '1.0' : page === gallery || page === generator ? '0.9' : '0.8')
const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPages
  .map(
    (template) => `  <url>
    <loc>${pageUrl(template.slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority(template)}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)

console.log(`prerender: wrote landing + ${data.templates.length} template pages + templates gallery + sitemap.xml`)
