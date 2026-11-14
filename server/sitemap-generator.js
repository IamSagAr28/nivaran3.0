const fs = require('fs');
const path = require('path');

const TARGET_CITIES = [
  { code: 'kn', name: 'kanpur', label: 'Kanpur' },
  { code: 'mum', name: 'mumbai', label: 'Mumbai' },
  { code: 'del', name: 'delhi', label: 'Delhi NCR' },
  { code: 'blr', name: 'bangalore', label: 'Bangalore' },
  { code: 'hyd', name: 'hyderabad', label: 'Hyderabad' },
  { code: 'pune', name: 'pune', label: 'Pune' },
  { code: 'lko', name: 'lucknow', label: 'Lucknow' }
];

function categoryToSlug(category) {
  if (!category || typeof category !== 'string') return '';
  const trimmed = category.trim();
  if (trimmed.toLowerCase() === 'all') return '';
  return trimmed
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateSitemapXml(db) {
  const baseUrl = 'https://www.nivaranupcyclers.com';
  const currentDate = new Date().toISOString().split('T')[0];

  let products = [];
  let blogs = [];
  try {
    products = await db.allAsync('SELECT id, title, category, custom_slug, city_slugs, updated_at FROM products ORDER BY id', []);
  } catch (e) {
    console.warn('Sitemap DB query warning (products):', e.message);
  }
  try {
    blogs = await db.allAsync('SELECT blog_handle, article_handle, updated_at FROM blogs', []);
  } catch (e) {
    console.warn('Sitemap DB query warning (blogs):', e.message);
  }

  const urlMap = new Map();

  function addUrl(loc, priority = '0.8', changefreq = 'weekly', lastmod = currentDate) {
    const cleanLoc = loc.replace(/\/+$/, '').replace(/https?:\/\/(www\.)?nivaranupcyclers\.com/, baseUrl);
    const finalLoc = cleanLoc === baseUrl ? `${baseUrl}/` : cleanLoc;
    if (!urlMap.has(finalLoc)) {
      urlMap.set(finalLoc, { loc: finalLoc, priority, changefreq, lastmod });
    }
  }

  // 1. Static Core Pages
  addUrl(`${baseUrl}/`, '1.0', 'daily');
  addUrl(`${baseUrl}/products`, '0.9', 'daily');
  addUrl(`${baseUrl}/cart`, '0.7', 'weekly');
  addUrl(`${baseUrl}/privacy`, '0.5', 'monthly');
  addUrl(`${baseUrl}/terms`, '0.5', 'monthly');
  addUrl(`${baseUrl}/shipping`, '0.5', 'monthly');

  // 2. Category Pages
  if (Array.isArray(products)) {
    const seenCatSlugs = new Set();
    products.forEach(p => {
      const catSlug = categoryToSlug(p.category);
      if (catSlug && !seenCatSlugs.has(catSlug)) {
        seenCatSlugs.add(catSlug);
        addUrl(`${baseUrl}/products/${catSlug}`, '0.8', 'weekly', currentDate);
      }
    });
  }

  // 2. Dynamic Products & City SEO URLs
  if (Array.isArray(products)) {
    products.forEach(p => {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : currentDate;
      // Canonical product URL
      addUrl(`${baseUrl}/product/${p.id}`, '0.8', 'weekly', lastmod);

      let citySlugsMap = {};
      if (typeof p.city_slugs === 'string') {
        try { citySlugsMap = JSON.parse(p.city_slugs || '{}'); } catch {}
      } else if (typeof p.city_slugs === 'object' && p.city_slugs !== null) {
        citySlugsMap = { ...p.city_slugs };
      }

      const rawTitle = typeof p.title === 'string' ? p.title : '';
      const rawCustomSlug = typeof p.custom_slug === 'string' ? p.custom_slug.trim() : '';
      const cleanTitleSlug = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `item-${p.id}`;

      TARGET_CITIES.forEach(city => {
        const code = city.code;
        const cityName = city.name;
        const cityLabel = city.label;

        // Match assigned custom city slug for this city
        const matchedKey = Object.keys(citySlugsMap).find(k =>
          k.toLowerCase() === cityLabel.toLowerCase() ||
          k.toLowerCase() === cityName.toLowerCase() ||
          (cityName === 'delhi' && k.toLowerCase() === 'delhi ncr')
        );

        if (matchedKey && citySlugsMap[matchedKey]?.trim()) {
          const cleanSlug = citySlugsMap[matchedKey].trim().replace(/^\/+/, '');
          addUrl(`${baseUrl}/${code}/${cleanSlug}`, '0.9', 'weekly', lastmod);
        } else if (rawCustomSlug) {
          addUrl(`${baseUrl}/${code}/${rawCustomSlug}-in-${cityName}`, '0.8', 'weekly', lastmod);
        } else {
          addUrl(`${baseUrl}/${code}/${cleanTitleSlug}-in-${cityName}`, '0.8', 'weekly', lastmod);
        }
      });
    });
  }

  // 3. Blogs
  if (Array.isArray(blogs)) {
    blogs.forEach(b => {
      if (b.blog_handle && b.article_handle) {
        const lastmod = b.updated_at ? new Date(b.updated_at).toISOString().split('T')[0] : currentDate;
        addUrl(`${baseUrl}/blogs/${b.blog_handle}/${b.article_handle}`, '0.7', 'weekly', lastmod);
      }
    });
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const item of urlMap.values()) {
    xml += `  <url>\n    <loc>${item.loc}</loc>\n    <lastmod>${item.lastmod}</lastmod>\n    <changefreq>${item.changefreq}</changefreq>\n    <priority>${item.priority}</priority>\n  </url>\n`;
  }
  xml += `</urlset>\n`;

  // Asynchronously write static fallback files to disk if directories exist
  const candidatePaths = [
    path.resolve(__dirname, '../dist/sitemap.xml'),
    path.resolve(__dirname, '../public/sitemap.xml'),
    '/var/www/nivaran/dist/sitemap.xml',
    '/var/www/nivaran/public/sitemap.xml'
  ];

  for (const filePath of candidatePaths) {
    try {
      const dir = path.dirname(filePath);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(filePath, xml, 'utf8');
      }
    } catch {}
  }

  return { xml, count: urlMap.size };
}

module.exports = {
  TARGET_CITIES,
  generateSitemapXml
};
