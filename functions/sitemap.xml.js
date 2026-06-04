const SUPABASE_URL = 'https://sufzgioxlxmffgllsuhv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1ZnpnaW94bHhtZmZnbGxzdWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDUwODQsImV4cCI6MjA5NTE4MTA4NH0.XakTCq34H85goRwIerBU0QljnoQKNX6uythZ1nv96hg';
const SITE = 'https://resellerspro.com';

function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDate(value) {
  try {
    if (!value) return new Date().toISOString();
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch (_) {
    return new Date().toISOString();
  }
}

function urlNode(loc, lastmod, changefreq, priority) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    `    <lastmod>${xmlEscape(isoDate(lastmod))}</lastmod>`,
    `    <changefreq>${xmlEscape(changefreq)}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>'
  ].join('\n');
}

async function fetchPosts() {
  const url = `${SUPABASE_URL}/rest/v1/news_posts?select=slug,updated_at,published_at&status=eq.published&publish_to_resellerspro=eq.true&order=published_at.desc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!res.ok) return [];
  const rows = await res.json();
  return Array.isArray(rows) ? rows.filter((p) => p && p.slug) : [];
}

export async function onRequestGet() {
  const now = new Date().toISOString();
  const staticUrls = [
    urlNode(`${SITE}/`, now, 'weekly', '1.0'),
    urlNode(`${SITE}/pricing.html`, now, 'monthly', '0.9'),
    urlNode(`${SITE}/news/`, now, 'daily', '0.9'),
    urlNode(`${SITE}/ebay-fee-calculator.html`, now, 'monthly', '0.8'),
    urlNode(`${SITE}/reseller-roi-calculator.html`, now, 'monthly', '0.8'),
    urlNode(`${SITE}/sell-through-rate-calculator.html`, now, 'monthly', '0.8'),
    urlNode(`${SITE}/faq.html`, now, 'monthly', '0.6'),
    urlNode(`${SITE}/setup.html`, now, 'monthly', '0.5'),
    urlNode(`${SITE}/privacy.html`, now, 'yearly', '0.3'),
    urlNode(`${SITE}/terms.html`, now, 'yearly', '0.3')
  ];

  const posts = await fetchPosts();
  const postUrls = posts.map((p) =>
    urlNode(`${SITE}/news/post.html?slug=${encodeURIComponent(p.slug)}`, p.updated_at || p.published_at || now, 'weekly', '0.8')
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticUrls.concat(postUrls).join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=900'
    }
  });
}
