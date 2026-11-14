import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, Search, Plus, Edit2, RotateCcw, ExternalLink, CheckCircle2, 
  AlertCircle, Sparkles, RefreshCw, X, Save, Tag, FileText, Check
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { 
  fetchAdminPageSeo, 
  createAdminPageSeo, 
  updateAdminPageSeo, 
  deleteAdminPageSeo,
  fetchCategories,
  fetchProducts
} from '../../utils/shopApi';
import { 
  clearPageSeoCache, 
  getLocalPageSeoOverrides, 
  saveLocalPageSeoOverride, 
  removeLocalPageSeoOverride 
} from '../../utils/usePageSeo';
import { PageSeo } from '../../types/admin';
import { useRouter } from '../../utils/Router';
import { categoryToSlug, getCategoryUrl } from '../../utils/categorySlug';

interface SeoAdminProps {
  onLogout: () => void;
}

export interface SitePageDefinition {
  id?: number;
  page_name: string;
  page_path: string;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  no_index?: boolean;
  is_custom?: boolean;
  type?: 'core' | 'category' | 'policy' | 'custom';
}

export const BASE_SITE_PAGES: SitePageDefinition[] = [
  {
    page_name: 'Home Page',
    page_path: '/',
    meta_title: 'Nivaran Upcyclers | Sustainable Eco-Friendly Corporate Gifts & Products',
    meta_description: 'Shop eco-friendly, sustainable handcrafted gifts, corporate hampers, bags, and plantable stationery from Nivaran Upcyclers. Empowering artisans across India.',
    canonical_url: 'https://nivaranupcyclers.com/',
    type: 'core'
  },
  {
    page_name: 'Shop / All Products',
    page_path: '/products',
    meta_title: 'All Products | Eco-Friendly & Upcycled Store - Nivaran Upcyclers',
    meta_description: 'Explore our complete range of sustainable, eco-friendly, and upcycled products. Ethically handmade gifts, planters, bamboo accessories, and zero-waste essentials.',
    canonical_url: 'https://nivaranupcyclers.com/products',
    type: 'core'
  },
  {
    page_name: 'Category: Upcycled Bags',
    page_path: '/products/bags',
    meta_title: 'Upcycled Bags & Pouches | Eco-Friendly Handcrafted Bags - Nivaran Upcyclers',
    meta_description: 'Shop sustainable upcycled bags, tote bags, laptop sleeves, and pouches made from repurposed fabric. Durable, zero-waste, and handcrafted in India.',
    canonical_url: 'https://nivaranupcyclers.com/products/bags',
    type: 'category'
  },
  {
    page_name: 'Category: Bamboo Products',
    page_path: '/products/bamboo-products',
    meta_title: 'Bamboo Products | Natural & Sustainable Everyday Essentials - Nivaran Upcyclers',
    meta_description: 'Discover 100% natural and biodegradable bamboo products, bamboo cutlery, organizers, and eco-friendly accessories by Nivaran Upcyclers.',
    canonical_url: 'https://nivaranupcyclers.com/products/bamboo-products',
    type: 'category'
  },
  {
    page_name: 'Category: Eco Stationery',
    page_path: '/products/stationery',
    meta_title: 'Plantable Stationery & Eco-Friendly Notebooks - Nivaran Upcyclers',
    meta_description: 'Browse seed pens, plantable pencils, seed paper notebooks, and zero-waste office stationery that blooms into plants after use.',
    canonical_url: 'https://nivaranupcyclers.com/products/stationery',
    type: 'category'
  },
  {
    page_name: 'Category: Home Decor',
    page_path: '/products/household-decoratives',
    meta_title: 'Upcycled Home Decor & Artisanal Crafts - Nivaran Upcyclers',
    meta_description: 'Elevate your living space with sustainable, upcycled home decor items, handcrafted planters, and eco-friendly home furnishings.',
    canonical_url: 'https://nivaranupcyclers.com/products/household-decoratives',
    type: 'category'
  },
  {
    page_name: 'Category: Corporate Gifting',
    page_path: '/products/corporate-gifting',
    meta_title: 'Sustainable Corporate Gifting | Eco-Friendly Gift Hampers - Nivaran Upcyclers',
    meta_description: 'Customized sustainable corporate gifts and eco-hampers for clients, employees, and events. Custom branding and bulk orders available.',
    canonical_url: 'https://nivaranupcyclers.com/products/corporate-gifting',
    type: 'category'
  },
  {
    page_name: 'Category: Planters',
    page_path: '/products/planters',
    meta_title: 'Eco-Friendly Planters & Green Decor - Nivaran Upcyclers',
    meta_description: 'Handcrafted planters and sustainable gardening accessories made from recycled and natural materials.',
    canonical_url: 'https://nivaranupcyclers.com/products/planters',
    type: 'category'
  },
  {
    page_name: 'Shopping Cart',
    page_path: '/cart',
    meta_title: 'Your Shopping Cart - Nivaran Upcyclers',
    meta_description: 'Review your eco-friendly cart items and proceed to secure checkout on Nivaran Upcyclers.',
    canonical_url: 'https://nivaranupcyclers.com/cart',
    type: 'core'
  },
  {
    page_name: 'Nivaran Membership',
    page_path: '/membership',
    meta_title: 'Nivaran Community Membership | Join the Green Revolution',
    meta_description: 'Join the Nivaran sustainability community. Exclusive discounts, tree planting initiatives, and eco-friendly perks.',
    canonical_url: 'https://nivaranupcyclers.com/membership',
    type: 'core'
  },
  {
    page_name: 'Privacy Policy',
    page_path: '/privacy-policy',
    meta_title: 'Privacy Policy - Nivaran Upcyclers',
    meta_description: 'Learn how Nivaran Upcyclers collects, uses, and safeguards your personal data.',
    canonical_url: 'https://nivaranupcyclers.com/privacy-policy',
    type: 'policy'
  },
  {
    page_name: 'Terms of Service',
    page_path: '/terms-of-service',
    meta_title: 'Terms of Service - Nivaran Upcyclers',
    meta_description: 'Terms and conditions for using the Nivaran Upcyclers online store and services.',
    canonical_url: 'https://nivaranupcyclers.com/terms-of-service',
    type: 'policy'
  },
  {
    page_name: 'Shipping & Delivery Policy',
    page_path: '/shipping-policy',
    meta_title: 'Shipping & Delivery Policy - Nivaran Upcyclers',
    meta_description: 'Read our domestic shipping policy, delivery timelines, and packaging practices.',
    canonical_url: 'https://nivaranupcyclers.com/shipping-policy',
    type: 'policy'
  },
];

export default function SeoAdmin({ onLogout }: SeoAdminProps) {
  const { navigateTo } = useRouter();
  const [pages, setPages] = useState<SitePageDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'core' | 'category' | 'policy'>('all');
  const [editingPage, setEditingPage] = useState<SitePageDefinition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    page_name: '',
    page_path: '',
    meta_title: '',
    meta_description: '',
    canonical_url: '',
    no_index: false,
  });

  const loadAllPages = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch remote backend records if available
      let apiPages: PageSeo[] = [];
      try {
        const res = await fetchAdminPageSeo();
        if (Array.isArray(res?.pages)) {
          apiPages = res.pages;
        }
      } catch {
        // Fallback gracefully if API table not yet created on remote server
      }

      // 2. Fetch categories to ensure dynamic categories are included
      let extraCategoryPages: SitePageDefinition[] = [];
      try {
        const [catRes, prodRes] = await Promise.all([
          fetchCategories().catch(() => ({ categories: [] })),
          fetchProducts().catch(() => ({ products: [] }))
        ]);
        const setOfCategories = new Set<string>();
        (catRes?.categories || []).forEach((c: any) => {
          const name = typeof c === 'string' ? c : c?.name;
          if (name && name.toLowerCase() !== 'all') setOfCategories.add(name);
        });
        (prodRes?.products || []).forEach((p: any) => {
          if (p?.category && p.category.toLowerCase() !== 'all') setOfCategories.add(p.category);
        });

        extraCategoryPages = Array.from(setOfCategories).map(catName => {
          const slug = categoryToSlug(catName);
          const path = `/products/${slug}`;
          return {
            page_name: `Category: ${catName}`,
            page_path: path,
            meta_title: `${catName} | Eco-Friendly & Sustainable - Nivaran Upcyclers`,
            meta_description: `Shop sustainably handcrafted ${catName.toLowerCase()} and eco-friendly products at Nivaran Upcyclers.`,
            canonical_url: `https://nivaranupcyclers.com${path}`,
            type: 'category' as const
          };
        });
      } catch {
        // Fallback to static defaults
      }

      // 3. Read local overrides
      const localOverrides = getLocalPageSeoOverrides();

      // 4. Combine base pages + dynamic categories
      const allBaselinePages: SitePageDefinition[] = [...BASE_SITE_PAGES];
      extraCategoryPages.forEach(extra => {
        const normPath = extra.page_path.toLowerCase();
        if (!allBaselinePages.some(b => b.page_path.toLowerCase() === normPath)) {
          allBaselinePages.push(extra);
        }
      });

      // 5. Index API and local overrides by normalized path
      const overridesByPath = new Map<string, { api?: PageSeo; local?: PageSeo }>();
      
      apiPages.forEach(ap => {
        if (!ap?.page_path) return;
        const key = '/' + ap.page_path.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
        const existing = overridesByPath.get(key) || {};
        existing.api = ap;
        overridesByPath.set(key, existing);
      });

      Object.entries(localOverrides).forEach(([rawPath, lp]) => {
        const key = '/' + rawPath.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
        const existing = overridesByPath.get(key) || {};
        existing.local = lp;
        overridesByPath.set(key, existing);
      });

      // 6. Merge overrides onto baseline pages
      const mergedList: SitePageDefinition[] = allBaselinePages.map(base => {
        const normKey = '/' + base.page_path.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
        const override = overridesByPath.get(normKey);
        overridesByPath.delete(normKey); // remove processed

        const activeOverride = override?.local || override?.api;
        const isCustom = Boolean(
          activeOverride && (
            (activeOverride.meta_title && activeOverride.meta_title.trim() !== base.meta_title) ||
            (activeOverride.meta_description && activeOverride.meta_description.trim() !== base.meta_description) ||
            (activeOverride.canonical_url && activeOverride.canonical_url.trim() !== base.canonical_url) ||
            activeOverride.no_index
          )
        );

        return {
          id: override?.api?.id,
          page_name: activeOverride?.page_name || base.page_name,
          page_path: base.page_path,
          meta_title: (activeOverride?.meta_title && activeOverride.meta_title.trim()) || base.meta_title,
          meta_description: (activeOverride?.meta_description && activeOverride.meta_description.trim()) || base.meta_description,
          canonical_url: (activeOverride?.canonical_url && activeOverride.canonical_url.trim()) || base.canonical_url,
          no_index: Boolean(activeOverride?.no_index),
          is_custom: isCustom,
          type: base.type || 'core'
        };
      });

      // 7. Any remaining overrides that were custom URLs not in baseline
      overridesByPath.forEach((override, pathKey) => {
        const rec = override.local || override.api;
        if (rec) {
          mergedList.push({
            id: override.api?.id,
            page_name: rec.page_name || pathKey,
            page_path: rec.page_path || pathKey,
            meta_title: rec.meta_title || '',
            meta_description: rec.meta_description || '',
            canonical_url: rec.canonical_url || `https://nivaranupcyclers.com${rec.page_path}`,
            no_index: Boolean(rec.no_index),
            is_custom: true,
            type: 'custom'
          });
        }
      });

      setPages(mergedList);
    } catch (err: any) {
      setError(err.message || 'Failed to load page SEO data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllPages();
  }, []);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingPage(null);
    setFormData({
      page_name: '',
      page_path: '',
      meta_title: '',
      meta_description: '',
      canonical_url: '',
      no_index: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: SitePageDefinition) => {
    setEditingPage(p);
    setFormData({
      page_name: p.page_name || '',
      page_path: p.page_path || '',
      meta_title: p.meta_title || '',
      meta_description: p.meta_description || '',
      canonical_url: p.canonical_url || '',
      no_index: Boolean(p.no_index),
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.page_path.trim()) {
      alert('Page URL Path is required');
      return;
    }

    setSaving(true);
    try {
      const normalizedPath = '/' + formData.page_path.trim().replace(/^\/+/, '');
      const payload: PageSeo = {
        id: editingPage?.id || 0,
        page_name: formData.page_name.trim() || formData.page_path.trim(),
        page_path: normalizedPath,
        meta_title: formData.meta_title.trim(),
        meta_description: formData.meta_description.trim(),
        canonical_url: formData.canonical_url.trim() || `https://nivaranupcyclers.com${normalizedPath}`,
        no_index: formData.no_index ? 1 : 0,
      };

      // 1. Save locally immediately so changes work in all browsers / local dev
      saveLocalPageSeoOverride(payload);

      // 2. Also attempt to save to database backend
      try {
        if (editingPage && editingPage.id) {
          await updateAdminPageSeo(editingPage.id, payload as any);
        } else {
          const apiRes = await createAdminPageSeo(payload as any);
          if (apiRes?.page?.id) {
            payload.id = apiRes.page.id;
            saveLocalPageSeoOverride(payload);
          }
        }
      } catch (apiErr) {
        // Backend table might not exist yet on remote proxy; local storage saved successfully
        console.warn('Backend API save warning (saved to browser storage):', apiErr);
      }

      clearPageSeoCache();
      showStatus('success', `SEO for "${payload.page_name}" saved successfully!`);
      setIsModalOpen(false);
      await loadAllPages();
    } catch (err: any) {
      alert(err.message || 'Failed to save page SEO');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async (p: SitePageDefinition) => {
    if (!confirm(`Reset "${p.page_name}" (${p.page_path}) to system default SEO?`)) {
      return;
    }
    try {
      removeLocalPageSeoOverride(p.page_path);
      if (p.id) {
        try {
          await deleteAdminPageSeo(p.id);
        } catch (apiErr) {
          console.warn('API delete error', apiErr);
        }
      }
      clearPageSeoCache();
      showStatus('success', `Reset "${p.page_name}" back to default SEO.`);
      await loadAllPages();
    } catch (err: any) {
      alert(err.message || 'Failed to reset page SEO');
    }
  };

  const filteredPages = useMemo(() => {
    return pages.filter(p => {
      // Tab filter
      if (activeTab === 'custom' && !p.is_custom) return false;
      if (activeTab === 'core' && p.type !== 'core') return false;
      if (activeTab === 'category' && p.type !== 'category') return false;
      if (activeTab === 'policy' && p.type !== 'policy') return false;

      // Search filter
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (p.page_name || '').toLowerCase().includes(q) ||
        (p.page_path || '').toLowerCase().includes(q) ||
        (p.meta_title || '').toLowerCase().includes(q) ||
        (p.meta_description || '').toLowerCase().includes(q)
      );
    });
  }, [pages, search, activeTab]);

  const stats = useMemo(() => {
    const total = pages.length;
    const custom = pages.filter(p => p.is_custom).length;
    const coreCount = pages.filter(p => p.type === 'core').length;
    const catCount = pages.filter(p => p.type === 'category').length;
    return { total, custom, coreCount, catCount };
  }, [pages]);

  return (
    <AdminLayout onLogout={onLogout} currentPage="seo">
      <div className="admin-content-inner" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px', color: '#2563eb' }}>
                <Globe size={26} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>SEO & Metadata Manager</h1>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
                  Edit Meta Titles, Descriptions, and Canonical Tags for every page and category across the website.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={loadAllPages}
              className="admin-btn secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Refresh"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="admin-btn primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: '#fff', padding: '10px 18px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={18} />
              <span>Add Custom Page</span>
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div style={{
            background: statusMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${statusMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: statusMessage.type === 'success' ? '#065f46' : '#991b1b',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>TOTAL WEBSITE PAGES</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>All live pages & categories</div>
          </div>
          <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>CUSTOMIZED BY SEO TEAM</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a', marginTop: '6px' }}>{stats.custom}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Custom overrides active</div>
          </div>
          <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#2563eb', fontSize: '13px', fontWeight: 600 }}>CATEGORY PAGES</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb', marginTop: '6px' }}>{stats.catCount}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>SEO URLs (/products/...)</div>
          </div>
          <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#8b5cf6', fontSize: '13px', fontWeight: 600 }}>CORE & POLICY PAGES</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#8b5cf6', marginTop: '6px' }}>{stats.coreCount + (pages.length - stats.catCount - stats.coreCount)}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Home, Shop, Cart, Policies</div>
          </div>
        </div>

        {/* Product SEO Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #bbf7d0',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#16a34a" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#14532d' }}>Looking to edit Product-Specific SEO?</h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#334155' }}>
              To customize the Meta Title, Description, or Canonical URL for individual products, open any product in <strong>Product Management</strong> and scroll to the <strong>SEO & Meta Tags</strong> section.
            </p>
          </div>
          <button
            onClick={() => navigateTo('/admin/products')}
            style={{
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Go to Products →
          </button>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                border: 'none',
                background: activeTab === 'all' ? '#fff' : 'transparent',
                color: activeTab === 'all' ? '#0f172a' : '#64748b',
                fontWeight: activeTab === 'all' ? 600 : 500,
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: activeTab === 'all' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              All Pages ({pages.length})
            </button>
            <button
              onClick={() => setActiveTab('core')}
              style={{
                border: 'none',
                background: activeTab === 'core' ? '#fff' : 'transparent',
                color: activeTab === 'core' ? '#0f172a' : '#64748b',
                fontWeight: activeTab === 'core' ? 600 : 500,
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: activeTab === 'core' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Core Pages
            </button>
            <button
              onClick={() => setActiveTab('category')}
              style={{
                border: 'none',
                background: activeTab === 'category' ? '#fff' : 'transparent',
                color: activeTab === 'category' ? '#0f172a' : '#64748b',
                fontWeight: activeTab === 'category' ? 600 : 500,
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: activeTab === 'category' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Categories ({stats.catCount})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              style={{
                border: 'none',
                background: activeTab === 'custom' ? '#fff' : 'transparent',
                color: activeTab === 'custom' ? '#0f172a' : '#64748b',
                fontWeight: activeTab === 'custom' ? 600 : 500,
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: activeTab === 'custom' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Customized ({stats.custom})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ background: '#fff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '8px', width: '360px', maxWidth: '100%' }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by path (e.g. /products/bags), title, or keywords..."
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Pages Table */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600, width: '22%' }}>Page & URL Path</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, width: '26%' }}>Active Meta Title</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, width: '28%' }}>Active Meta Description</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, width: '12%' }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, width: '12%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      Loading pages and metadata...
                    </td>
                  </tr>
                ) : filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      No pages found matching "{search}".
                    </td>
                  </tr>
                ) : (
                  filteredPages.map(p => {
                    return (
                      <tr key={p.page_path} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        
                        {/* Page & Path */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {p.page_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#2563eb', fontFamily: 'monospace', marginTop: '2px', wordBreak: 'break-all' }}>
                            {p.page_path}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            Canonical: <span style={{ color: '#64748b' }}>{p.canonical_url}</span>
                          </div>
                        </td>

                        {/* Title */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ color: '#0f172a', fontWeight: 500, lineHeight: 1.4 }}>
                            {p.meta_title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            {p.is_custom ? (
                              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Check size={12} /> Custom Title
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#64748b' }}>System Default</span>
                            )}
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {p.meta_title.length} chars</span>
                          </div>
                        </td>

                        {/* Description */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ color: '#475569', fontSize: '13px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {p.meta_description}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            {p.is_custom ? (
                              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Custom Description</span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#64748b' }}>System Default</span>
                            )}
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {p.meta_description.length} chars</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 18px' }}>
                          {p.is_custom ? (
                            <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, display: 'inline-block' }}>
                              Custom Active
                            </span>
                          ) : (
                            <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, display: 'inline-block' }}>
                              Default Active
                            </span>
                          )}
                          {p.no_index ? (
                            <span style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, marginLeft: '4px', display: 'inline-block' }}>
                              noindex
                            </span>
                          ) : null}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <a
                              href={p.page_path}
                              target="_blank"
                              rel="noreferrer"
                              title="View Page"
                              style={{ color: '#64748b', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                            >
                              <ExternalLink size={16} />
                            </a>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="admin-btn edit"
                              title="Edit SEO for this page"
                              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>
                            {p.is_custom && (
                              <button
                                onClick={() => handleResetToDefault(p)}
                                title="Reset to system default"
                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 600 }}
                              >
                                <RotateCcw size={12} />
                                <span>Reset</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Edit / Add */}
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={22} color="#2563eb" />
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                    {editingPage ? `Edit SEO: ${editingPage.page_name}` : 'Add Custom Page SEO'}
                  </h2>
                </div>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Page Friendly Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.page_name}
                      onChange={e => setFormData({ ...formData, page_name: e.target.value })}
                      placeholder="e.g. Home Page, Bags Category"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Page URL Path *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.page_path}
                      onChange={e => setFormData({ ...formData, page_path: e.target.value })}
                      placeholder="e.g. / or /products or /products/bags"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      Meta Title (Title Tag) *
                    </label>
                    <span style={{ fontSize: '11px', color: formData.meta_title.length > 60 ? '#dc2626' : '#64748b' }}>
                      {formData.meta_title.length} / 60 characters
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.meta_title}
                    onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="Enter custom title tag for search engines"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Tip: Keep under 60 characters to prevent truncation on Google search result pages.
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      Meta Description *
                    </label>
                    <span style={{ fontSize: '11px', color: formData.meta_description.length > 160 ? '#dc2626' : '#64748b' }}>
                      {formData.meta_description.length} / 160 characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={formData.meta_description}
                    onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="Enter meta description summary for search engines"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Tip: Aim between 120-160 characters for optimal click-through rates.
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Canonical Tag URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.canonical_url}
                    onChange={e => setFormData({ ...formData, canonical_url: e.target.value })}
                    placeholder={`e.g. https://nivaranupcyclers.com${formData.page_path || ''}`}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Auto-defaults to https://nivaranupcyclers.com{formData.page_path}. Customize only if consolidating URL variants.
                  </span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={formData.no_index}
                      onChange={e => setFormData({ ...formData, no_index: e.target.checked })}
                    />
                    <span>Tell search engines not to index this page (<code>noindex, nofollow</code>)</span>
                  </label>
                </div>

                {/* Google Preview Snippet */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Live Google Search Snippet Preview
                  </span>
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#202124' }}>
                      https://nivaranupcyclers.com{formData.page_path ? (formData.page_path === '/' ? '' : ` › ${formData.page_path.replace(/^\//, '')}`) : ''}
                    </div>
                    <div style={{ fontSize: '18px', color: '#1a0dab', fontWeight: 500, lineHeight: 1.3, marginTop: '2px', cursor: 'pointer' }}>
                      {formData.meta_title || `${formData.page_name || 'Nivaran'} | Eco-Friendly Upcycled Products`}
                    </div>
                    <div style={{ fontSize: '13px', color: '#4d5156', lineHeight: 1.4, marginTop: '4px' }}>
                      {formData.meta_description || 'Explore sustainable, handcrafted eco-friendly creations, seed paper items, and zero-waste products by Nivaran Upcyclers.'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="admin-btn secondary"
                    style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="admin-btn primary"
                    style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Save size={16} />
                    <span>{saving ? 'Saving...' : 'Save Page SEO'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
