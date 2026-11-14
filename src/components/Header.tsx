import { useState, useEffect, useRef } from "react";
import { Search, ShoppingBag, User, Menu, X, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "../utils/Router";
import { useShopCart } from "../contexts/ShopCartContext";
import { useAuth } from "../contexts/AuthContext";
import { useShopifyProducts } from "../hooks/useShopifyProducts";
import { getOptimizedImageUrl } from "../shopify/client";
import { UserAvatar } from "./UserAvatar";
import { fetchProducts, fetchCategories, apiUrl } from "../utils/shopApi";
import { getCategoryUrl } from "../utils/categorySlug";
import "../styles/Header.css";

function CategoryCard({ category, navigateTo }: { category: any; navigateTo: (path: string) => void }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  // Parallax offset (opposite direction of cursor)
  const parallaxX = isHovered ? -mousePos.x * 8 : 0;
  const parallaxY = isHovered ? -mousePos.y * 8 : 0;
  // Lift effect
  const liftY = isHovered ? -8 : 0;
  // Scale effect
  const scale = isHovered ? 1.1 : 1;

  const imageSrc = category.image
    ? (category.image.startsWith('http') || category.image.startsWith('/') || category.image.startsWith('data:')
        ? category.image
        : getOptimizedImageUrl(category.image, 400, 400))
    : '';

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .category-image-container {
            width: 96px !important;
            height: 96px !important;
            min-width: 96px !important;
            min-height: 96px !important;
            max-width: 96px !important;
            max-height: 96px !important;
          }
        }
      `}</style>
      <a
        href={getCategoryUrl(category.name)}
        onClick={(e) => {
          e.preventDefault();
          navigateTo(getCategoryUrl(category.name));
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex flex-col items-center gap-3 min-w-[80px] md:min-w-[96px] flex-shrink-0 text-[#2A2A2A] hover:text-[#DBB520] transition-all group no-underline"
      >
        <div
          className="category-image-container bg-white transition-all duration-300 shadow-sm group-hover:shadow-lg border border-gray-100"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            aspectRatio: '1',
            flexShrink: 0,
            minWidth: '80px',
            minHeight: '80px',
            maxWidth: '80px',
            maxHeight: '80px',
            transform: `translate(${parallaxX}px, ${parallaxY + liftY}px) scale(${scale})`,
            transition: 'transform 0.2s ease-out, box-shadow 0.3s ease-out'
          }}
        >
          <img
            src={imageSrc}
            alt={category.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              pointerEvents: 'none'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.innerHTML = '<div class="w-full h-full bg-[#DBB520] group-hover:bg-[#F8D548] rounded-full transition-colors flex items-center justify-center font-bold text-white text-xl">♻️</div>';
              }
            }}
          />
        </div>
        <span className="text-xs md:text-sm text-[#374151] font-medium text-center tracking-wide group-hover:text-[#DBB520] whitespace-nowrap overflow-hidden text-ellipsis w-full px-1">{category.name}</span>
      </a>
    </>
  );
}

const DEFAULT_CATEGORIES = [
  { name: 'Upcycled Bags', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80' },
  { name: 'Handmade Paper', image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80' },
  { name: 'Eco Stationery', image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80' },
  { name: 'Home Decor', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sustainable Crafts', image: 'https://images.unsplash.com/photo-1610177498701-4f00c0bd1694?auto=format&fit=crop&w=400&q=80' },
  { name: 'Upcycled Fabric', image: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=400&q=80' },
  { name: 'Eco Gifts', image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=400&q=80' },
];

export function Header({ showCategories = false }: { showCategories?: boolean }) {
  const { navigateTo, currentPath } = useRouter();
  const { totalItems: itemCount } = useShopCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { products: shopifyProducts } = useShopifyProducts();
  const categoryStripRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const scrollCategoryStrip = (direction: 'left' | 'right') => {
    if (categoryStripRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      categoryStripRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadDynamicCategories() {
      try {
        setLoadingCategories(true);
        // 1. Fetch backend products and categories
        const [productsRes, categoriesRes] = await Promise.all([
          fetchProducts().catch(() => ({ products: [] })),
          fetchCategories().catch(() => ({ categories: [] }))
        ]);

        const dbProducts = productsRes.products || [];
        const dbCategoriesList: string[] = categoriesRes.categories || [];

        const categoryMap = new Map<string, { name: string; image: string }>();

        if (dbProducts.length > 0) {
          dbProducts.forEach((p: any) => {
            const catName = p.category;
            if (catName && typeof catName === 'string') {
              const normKey = catName.trim().toLowerCase();
              if (!categoryMap.has(normKey)) {
                const img = apiUrl(`/api/products/${p.id}/media/0`);
                categoryMap.set(normKey, { name: catName.trim(), image: img });
              }
            }
          });
        }

        // Add any missing categories from dbCategoriesList
        dbCategoriesList.forEach(catName => {
          if (catName && typeof catName === 'string') {
            const normKey = catName.trim().toLowerCase();
            if (!categoryMap.has(normKey)) {
              categoryMap.set(normKey, { name: catName.trim(), image: '' });
            }
          }
        });

        // 2. Fallback or merge with Shopify products if available
        if (shopifyProducts && shopifyProducts.length > 0) {
          shopifyProducts.forEach((product: any) => {
            const type = product.productType || (product.tags && product.tags.length > 0 ? product.tags[0] : null);
            const imageUrl = product.images?.edges?.[0]?.node?.url || product.images?.[0]?.url || product.image?.url || '';
            if (type && typeof type === 'string') {
              const normKey = type.trim().toLowerCase();
              if (!categoryMap.has(normKey) && imageUrl) {
                categoryMap.set(normKey, { name: type.trim(), image: imageUrl });
              }
            }
          });
        }

        let result = Array.from(categoryMap.values());

        // Fill up to 7-9 items with DEFAULT_CATEGORIES if not enough categories
        if (result.length < 7) {
          const existingNames = new Set(result.map(c => c.name.toLowerCase()));
          DEFAULT_CATEGORIES.forEach(defCat => {
            if (result.length < 9 && !existingNames.has(defCat.name.toLowerCase())) {
              result.push(defCat);
            }
          });
        }

        if (isMounted && result.length > 0) {
          setCategories(result);
        }
      } catch (err) {
        console.error('Failed to load dynamic categories:', err);
      } finally {
        if (isMounted) setLoadingCategories(false);
      }
    }

    loadDynamicCategories();

    return () => {
      isMounted = false;
    };
  }, [shopifyProducts]);

  const handleNav = (sectionId: string) => {
    setMobileMenuOpen(false);

    if (sectionId === 'membership') {
      if (currentPath === '/') {
        const el = document.getElementById('membership');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      navigateTo('/membership');
      return;
    }

    if (currentPath !== '/') {
      navigateTo('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <header className="bg-white sticky top-0 z-50">
      {/* ─── TOP ANNOUNCEMENT BAR ─── */}
      <div className="nivaran-topbar">
        <div className="nivaran-topbar-inner">
          <div className="nivaran-marquee-container">
            <div className="nivaran-marquee-track">
              <span className="nivaran-marquee-item">🌱 Transforming Waste into Beautiful Products</span>
              <span className="nivaran-marquee-item">📦 Free Shipping on Orders Above ₹999</span>
              <span className="nivaran-marquee-item">✨ Handcrafted Sustainable Living</span>
              <span className="nivaran-marquee-item">🌱 Transforming Waste into Beautiful Products</span>
              <span className="nivaran-marquee-item">📦 Free Shipping on Orders Above ₹999</span>
              <span className="nivaran-marquee-item">✨ Handcrafted Sustainable Living</span>
            </div>
          </div>

          <div className="nivaran-topbar-actions">
            <button onClick={() => handleNav('workshops')} className="nivaran-topbar-link">🎨 Workshops</button>
            <button onClick={() => handleNav('contact')} className="nivaran-topbar-link">📞 Contact Us</button>
          </div>
        </div>
      </div>

      {/* ─── MAIN NAVIGATION (DESKTOP & MOBILE BAR) ─── */}
      <div className="nivaran-mainnav">
        <div className="nivaran-mainnav-inner">
          {/* Brand Logo - Left */}
          <div className="nivaran-brand-wrapper" onClick={() => navigateTo('/')} title="Nivaran Upcyclers Home">
            <img
              src="/images/logo.png"
              alt="Nivaran Logo"
              className="nivaran-brand-logo"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = `
                    <div style="width:44px;height:44px;background:#DBB520;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">♻️</div>
                    <div>
                      <h1 style="font-size:22px;font-weight:900;color:#1B4332;margin:0;line-height:1.1;">Nivaran</h1>
                      <p style="font-size:11px;font-weight:700;color:#2E6F40;margin:0;">Upcyclers</p>
                    </div>
                  `;
                }
              }}
            />
            <div className="nivaran-brand-text">
              <span className="nivaran-brand-title">
                Nivaran<sup style={{ fontSize: '11px', verticalAlign: 'top', marginLeft: '2px', fontWeight: 700 }}>TM</sup>
              </span>
              <span className="nivaran-brand-subtitle">Upcyclers</span>
            </div>
          </div>

          {/* ─── DESKTOP NAV LINKS (VISIBLE ON DESKTOP >= 1024px) ─── */}
          <nav className="nivaran-desktop-nav" aria-label="Desktop Navigation">
            <button onClick={() => navigateTo('/')} className="nivaran-nav-link">Home</button>
            <button onClick={() => navigateTo('/products')} className="nivaran-nav-link">Shop</button>
            <button
              onClick={() => handleNav('membership')}
              className="nivaran-nav-membership-btn"
              title="Book Nivaran Membership"
            >
              <span>Book Membership</span>
              <span className="nivaran-membership-badge-pill">Pan India</span>
            </button>
            <button onClick={() => handleNav('workshops')} className="nivaran-nav-link">Workshops</button>
            <button onClick={() => handleNav('about')} className="nivaran-nav-link">About Us</button>
            <button onClick={() => handleNav('our-story')} className="nivaran-nav-link">Our Story</button>
            <button onClick={() => handleNav('contact')} className="nivaran-nav-link">Contact</button>
          </nav>

          {/* ─── ACTION ICONS (RIGHT) ─── */}
          <div className="nivaran-header-actions">
            <button
              className="nivaran-icon-btn"
              onClick={() => navigateTo('/products')}
              title="Search Products"
              aria-label="Search Products"
            >
              <Search size={21} />
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => navigateTo('/dashboard')}
                className="nivaran-icon-btn"
                title="Your Dashboard"
                aria-label="Dashboard"
              >
                <UserAvatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size="sm"
                  className="rounded-full w-8 h-8"
                />
              </button>
            ) : (
              <button
                onClick={() => navigateTo('/login')}
                className="nivaran-icon-btn"
                title="Sign In / Account"
                aria-label="Account"
              >
                <User size={21} />
              </button>
            )}

            <button
              onClick={() => navigateTo('/cart')}
              className="nivaran-icon-btn"
              title="Shopping Cart"
              aria-label="Cart"
            >
              <ShoppingBag size={21} />
              {itemCount > 0 && (
                <span className="nivaran-cart-badge">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* Hamburger Button (Strictly Mobile Only, < 1024px) */}
            <button
              className="nivaran-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={25} /> : <Menu size={25} />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── MOBILE DRAWER & BACKDROP (< 1024px) ─── */}
      {mobileMenuOpen && (
        <>
          <div
            className="nivaran-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <aside className="nivaran-mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
            {/* Drawer Header */}
            <div className="nivaran-drawer-head">
              <div
                className="nivaran-brand-wrapper"
                onClick={() => { setMobileMenuOpen(false); navigateTo('/'); }}
              >
                <img
                  src="/images/logo.png"
                  alt="Nivaran Logo"
                  style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
                />
                <div className="nivaran-brand-text">
                  <span className="nivaran-brand-title" style={{ fontSize: '18px' }}>
                    Nivaran<sup style={{ fontSize: '9px', fontWeight: 700 }}>TM</sup>
                  </span>
                  <span className="nivaran-brand-subtitle" style={{ fontSize: '10px' }}>Upcyclers</span>
                </div>
              </div>

              <button
                className="nivaran-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="nivaran-drawer-menu">
              <button
                onClick={() => { setMobileMenuOpen(false); navigateTo('/'); }}
                className="nivaran-drawer-item"
              >
                <span>🏠</span>
                <span>Home</span>
              </button>

              <button
                onClick={() => { setMobileMenuOpen(false); navigateTo('/products'); }}
                className="nivaran-drawer-item"
              >
                <span>🛍️</span>
                <span>Shop All Products</span>
              </button>

              {/* Book Membership Feature Card */}
              <div
                onClick={() => handleNav('membership')}
                className="nivaran-drawer-membership-card"
                role="button"
                tabIndex={0}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#1B4332' }}>
                    📦 Book Membership
                  </div>
                  <div style={{ fontSize: '11px', color: '#665200', marginTop: '2px', fontWeight: 500 }}>
                    Doorstep pooja waste pickup & gift box
                  </div>
                </div>
                <span className="nivaran-membership-badge-pill" style={{ background: '#1B4332', color: '#FFF44F' }}>
                  Pan India
                </span>
              </div>

              <button onClick={() => handleNav('workshops')} className="nivaran-drawer-item">
                <span>🎨</span>
                <span>Workshops & Training</span>
              </button>

              <button onClick={() => handleNav('about')} className="nivaran-drawer-item">
                <span>ℹ️</span>
                <span>About Us</span>
              </button>

              <button onClick={() => handleNav('our-story')} className="nivaran-drawer-item">
                <span>🌱</span>
                <span>Our Story & Mission</span>
              </button>

              <button onClick={() => handleNav('contact')} className="nivaran-drawer-item">
                <span>📞</span>
                <span>Contact & Support</span>
              </button>
            </div>

            {/* Drawer Footer with Verified Policy Links */}
            <div className="nivaran-drawer-footer">
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9ca3af', fontWeight: 700, marginBottom: '8px' }}>
                Customer Policies
              </div>
              <div className="nivaran-drawer-policy-links">
                <span
                  onClick={() => { setMobileMenuOpen(false); navigateTo('/privacy-policy'); }}
                  className="nivaran-drawer-policy-link"
                >
                  Privacy Policy
                </span>
                <span>•</span>
                <span
                  onClick={() => { setMobileMenuOpen(false); navigateTo('/shipping-policy'); }}
                  className="nivaran-drawer-policy-link"
                >
                  Shipping Policy
                </span>
                <span>•</span>
                <span
                  onClick={() => { setMobileMenuOpen(false); navigateTo('/terms-of-service'); }}
                  className="nivaran-drawer-policy-link"
                >
                  Terms of Service
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                © {new Date().getFullYear()} Nivaran Upcyclers.
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ─── CATEGORY ICONS STRIP ─── */}
      {showCategories && (
        <div className="border-t border-[#e5e7eb] relative group" style={{ backgroundColor: '#F7F1E5' }}>
          <div className="mx-auto px-4 py-3 relative flex items-center" style={{ maxWidth: '1280px' }}>
            {/* Scroll Left Button */}
            <button
              onClick={() => scrollCategoryStrip('left')}
              className="absolute left-2 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md border border-gray-200 items-center justify-center text-gray-700 hover:text-black hover:bg-white transition-all transform hover:scale-110"
              style={{ display: 'flex' }}
              title="Scroll Left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Category Strip Container */}
            <div
              ref={categoryStripRef}
              className="category-strip flex items-center gap-6 overflow-x-auto scroll-smooth py-2 px-6 w-full"
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: '#DBB520 transparent',
              }}
            >
              <style>{`
                .category-strip::-webkit-scrollbar {
                  height: 4px;
                }
                .category-strip::-webkit-scrollbar-track {
                  background: transparent;
                }
                .category-strip::-webkit-scrollbar-thumb {
                  background: #DBB520;
                  border-radius: 4px;
                }
              `}</style>
              {loadingCategories ? (
                Array(9).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 min-w-[80px] flex-shrink-0">
                    <div
                      className="w-20 h-20 md:w-24 md:h-24 bg-gray-200 animate-pulse"
                      style={{
                        borderRadius: '50%',
                        overflow: 'hidden',
                        aspectRatio: '1'
                      }}
                    ></div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <CategoryCard key={category.name} category={category} navigateTo={navigateTo} />
                ))
              ) : (
                <div className="w-full text-center text-gray-500 py-4">No categories found</div>
              )}
            </div>

            {/* Scroll Right Button */}
            <button
              onClick={() => scrollCategoryStrip('right')}
              className="absolute right-2 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md border border-gray-200 items-center justify-center text-gray-700 hover:text-black hover:bg-white transition-all transform hover:scale-110"
              style={{ display: 'flex' }}
              title="Scroll Right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
