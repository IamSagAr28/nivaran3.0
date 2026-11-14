/**
 * Utility functions for Category URL slugs and matching.
 * Provides clean, SEO-friendly URLs:
 * e.g. /products/bags, /products/bamboo-products, /products/home-decor
 */

/**
 * Convert category name to a clean, SEO-friendly URL slug.
 * e.g. "Bags" -> "bags", "Bamboo products" -> "bamboo-products", "Bags & Pouches" -> "bags-and-pouches"
 */
export function categoryToSlug(category?: string | null): string {
  if (!category || typeof category !== 'string') return '';
  const trimmed = category.trim();
  if (trimmed.toLowerCase() === 'all') return '';
  return trimmed
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Returns full path for a category.
 * If empty or 'All', returns '/products'. Otherwise '/products/<slug>'.
 */
export function getCategoryUrl(category?: string | null): string {
  const slug = categoryToSlug(category);
  return slug ? `/products/${slug}` : '/products';
}

function normalizeAlphanumeric(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Given a URL slug (e.g. 'bags', 'bamboo-products', 'bag'), find matching category from available list.
 */
export function slugToCategory(slug?: string | null, availableCategories: string[] = []): string {
  if (!slug || typeof slug !== 'string') return 'All';
  const cleanSlug = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  if (!cleanSlug || cleanSlug === 'all') return 'All';

  const validCategories = (availableCategories || []).filter(c => c && typeof c === 'string' && c.trim() !== 'All');

  if (validCategories.length === 0) {
    // If categories not loaded yet, format human-friendly name from slug
    return cleanSlug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // 1. Exact slug match
  const exact = validCategories.find(c => categoryToSlug(c) === cleanSlug);
  if (exact) return exact;

  // 2. Singular / Plural match (e.g. 'bag' <-> 'bags', 'bamboo-product' <-> 'bamboo-products')
  if (cleanSlug.endsWith('s')) {
    const singular = cleanSlug.slice(0, -1);
    const singularMatch = validCategories.find(c => categoryToSlug(c) === singular);
    if (singularMatch) return singularMatch;
  } else {
    const plural = cleanSlug + 's';
    const pluralMatch = validCategories.find(c => categoryToSlug(c) === plural);
    if (pluralMatch) return pluralMatch;
  }

  // 3. Match normalized alphanumeric characters
  const normSlug = normalizeAlphanumeric(cleanSlug);
  const normMatch = validCategories.find(c => normalizeAlphanumeric(c) === normSlug);
  if (normMatch) return normMatch;

  // 4. Substring / Word match
  const partial = validCategories.find(c => {
    const nc = normalizeAlphanumeric(c);
    return nc.includes(normSlug) || normSlug.includes(nc);
  });
  if (partial) return partial;

  // Fallback to title-cased slug
  return cleanSlug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
