import { useEffect } from 'react';
import { fetchPublicPageSeo } from './shopApi';
import { PageSeo } from '../types/admin';

let pageSeoCache: Record<string, PageSeo> | null = null;
let pendingFetch: Promise<Record<string, PageSeo>> | null = null;

export function getLocalPageSeoOverrides(): Record<string, PageSeo> {
  try {
    const raw = localStorage.getItem('nivaran_page_seo_overrides');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalPageSeoOverride(page: PageSeo) {
  try {
    const current = getLocalPageSeoOverrides();
    const cleanKey = '/' + page.page_path.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    current[cleanKey] = page;
    localStorage.setItem('nivaran_page_seo_overrides', JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save local SEO override', e);
  }
}

export function removeLocalPageSeoOverride(pagePath: string) {
  try {
    const current = getLocalPageSeoOverrides();
    const cleanKey = '/' + pagePath.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    delete current[cleanKey];
    localStorage.setItem('nivaran_page_seo_overrides', JSON.stringify(current));
  } catch (e) {
    console.error('Failed to remove local SEO override', e);
  }
}

export async function getCachedPageSeo(): Promise<Record<string, PageSeo>> {
  const localOverrides = getLocalPageSeoOverrides();
  if (pageSeoCache) return { ...pageSeoCache, ...localOverrides };
  if (pendingFetch) {
    const apiMap = await pendingFetch;
    return { ...apiMap, ...localOverrides };
  }

  pendingFetch = fetchPublicPageSeo()
    .then((res: any) => {
      const map: Record<string, PageSeo> = {};
      if (Array.isArray(res?.pages)) {
        res.pages.forEach((p: PageSeo) => {
          if (p?.page_path) {
            const cleanKey = '/' + p.page_path.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
            map[cleanKey] = p;
          }
        });
      }
      pageSeoCache = map;
      return map;
    })
    .catch(() => {
      return {};
    });

  const apiMap = await pendingFetch;
  return { ...apiMap, ...localOverrides };
}

export function clearPageSeoCache() {
  pageSeoCache = null;
  pendingFetch = null;
}

export interface UsePageSeoOptions {
  title?: string;
  description?: string;
  canonical?: string;
}

/**
 * Universal React hook for Page-level SEO.
 * Applies default SEO first so crawlers and users have zero lag.
 * If the admin panel has configured custom meta title, description, or canonical URL for the page path,
 * it seamlessly overrides them without disturbing any other page or route.
 */
export function usePageSeo(path: string, defaults: UsePageSeoOptions = {}) {
  useEffect(() => {
    const originalTitle = document.title;
    const cleanPath = '/' + (path || window.location.pathname).trim().toLowerCase().replace(/^\/+|\/+$/g, '');

    // 1. Meta Description tag
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const originalDesc = metaDesc.getAttribute('content');

    // 2. Canonical Tag
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const originalCanonical = canonical.getAttribute('href');

    // 3. Robots tag (for noindex if enabled)
    let robotsMeta = document.querySelector('meta[name="robots"]');

    // Apply initial defaults
    if (defaults.title) document.title = defaults.title;
    if (defaults.description) metaDesc.setAttribute('content', defaults.description);
    if (defaults.canonical) canonical.setAttribute('href', defaults.canonical);

    // Apply any synchronous local overrides first
    const localOverrides = getLocalPageSeoOverrides();
    const localCustom = localOverrides[cleanPath] || localOverrides[cleanPath.replace(/\/+$/, '')];
    if (localCustom) {
      if (localCustom.meta_title && localCustom.meta_title.trim()) {
        document.title = localCustom.meta_title.trim();
      }
      if (localCustom.meta_description && localCustom.meta_description.trim()) {
        metaDesc.setAttribute('content', localCustom.meta_description.trim());
      }
      if (localCustom.canonical_url && localCustom.canonical_url.trim()) {
        canonical.setAttribute('href', localCustom.canonical_url.trim());
      }
    }

    // Apply custom overrides from database if set by SEO team
    let isMounted = true;
    getCachedPageSeo().then(map => {
      if (!isMounted) return;
      const custom = map[cleanPath] || map[cleanPath.replace(/\/+$/, '')];
      if (custom) {
        if (custom.meta_title && custom.meta_title.trim()) {
          document.title = custom.meta_title.trim();
        }
        if (custom.meta_description && custom.meta_description.trim()) {
          metaDesc?.setAttribute('content', custom.meta_description.trim());
        }
        if (custom.canonical_url && custom.canonical_url.trim()) {
          canonical?.setAttribute('href', custom.canonical_url.trim());
        }
        if (custom.no_index) {
          if (!robotsMeta) {
            robotsMeta = document.createElement('meta');
            robotsMeta.setAttribute('name', 'robots');
            document.head.appendChild(robotsMeta);
          }
          robotsMeta.setAttribute('content', 'noindex, nofollow');
        } else if (robotsMeta) {
          robotsMeta.setAttribute('content', 'all');
        }
      }
    });

    return () => {
      isMounted = false;
      document.title = originalTitle;
      if (originalDesc !== null) metaDesc?.setAttribute('content', originalDesc);
      if (originalCanonical !== null) canonical?.setAttribute('href', originalCanonical);
      if (robotsMeta) robotsMeta.setAttribute('content', 'all');
    };
  }, [path, defaults.title, defaults.description, defaults.canonical]);
}
