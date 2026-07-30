import { useState, useEffect } from "react";
import { Search, ShoppingBag, User, Menu, LogOut } from "lucide-react";
import { useRouter } from "../utils/Router";
import { useShopCart } from "../contexts/ShopCartContext";
import { useAuth } from "../contexts/AuthContext";
import { useShopifyProducts } from "../hooks/useShopifyProducts";
import { getOptimizedImageUrl } from "../shopify/client";
import { UserAvatar } from "./UserAvatar";
import { fetchProducts, fetchCategories, apiUrl } from "../utils/shopApi";

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
      <button
        onClick={() => {
          navigateTo(`/products?category=${encodeURIComponent(category.name)}`);
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex flex-col items-center gap-3 min-w-[80px] md:min-w-[96px] flex-shrink-0 text-[#2A2A2A] hover:text-[#DBB520] transition-all group"
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
      </button>
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
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDynamicCategories() {
      try {
        setLoadingCategories(true);
        // 1. Fetch backend products (without heavy base64 images payload) and categories
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
            if (catName && !categoryMap.has(catName)) {
              const img = apiUrl(`/api/products/${p.id}/media/0`);
              categoryMap.set(catName, { name: catName, image: img });
            }
          });
        }

        // Add any missing categories from dbCategoriesList
        dbCategoriesList.forEach(catName => {
          if (catName && !categoryMap.has(catName)) {
            categoryMap.set(catName, { name: catName, image: '' });
          }
        });

        // 2. Fallback or merge with Shopify products if available
        if (shopifyProducts && shopifyProducts.length > 0) {
          shopifyProducts.forEach((product: any) => {
            const type = product.productType || (product.tags && product.tags.length > 0 ? product.tags[0] : null);
            const imageUrl = product.images?.edges?.[0]?.node?.url || product.images?.[0]?.url || product.image?.url || '';
            if (type && !categoryMap.has(type) && imageUrl) {
              categoryMap.set(type, { name: type, image: imageUrl });
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
    if (currentPath !== '/') {
      navigateTo('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white sticky top-0 z-50" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
      {/* Top Navigation Bar */}
      <div className="text-[#2A2A2A] overflow-hidden" style={{ height: '40px', backgroundColor: '#FFF44F' }}>
        <div className="w-full px-4 h-full flex items-center text-sm relative">
          {/* Marquee - Takes available space */}
          <div className="flex-1 overflow-hidden" style={{ minWidth: 0, position: 'relative' }}>
            <div className="marquee-wrapper">
              <div className="marquee-content">
                <span className="marquee-text">🌱 Transforming Waste into Beautiful Products | Free Shipping on Orders Above ₹999</span>
              </div>
            </div>
          </div>

          {/* Buttons - Fixed to right end */}
          <div className="flex gap-4 flex-shrink-0">
            <button onClick={() => handleNav('workshops')} className="hover:text-[#F8D548] transition-colors whitespace-nowrap">Register Now</button>
            <button onClick={() => handleNav('contact')} className="hover:text-[#F8D548] transition-colors whitespace-nowrap">Contact Us</button>
          </div>
        </div>
        <style>{`
          .marquee-wrapper {
            overflow: hidden;
            width: 100%;
            position: relative;
            height: 100%;
            display: flex;
            align-items: center;
          }
          .marquee-content {
            display: inline-flex;
            white-space: nowrap;
            animation: marquee 10s linear infinite;
            will-change: transform;
            min-width: max-content;
          }
          .marquee-text {
            display: inline-block;
            padding-right: 4rem;
            flex-shrink: 0;
          }
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .marquee-content {
              animation: none;
            }
          }
        `}</style>
      </div>

      {/* Main Navigation */}
      <div className="w-full px-4" style={{ height: '80px' }}>
        <div className="flex items-center justify-between h-full relative">
          {/* Logo - Left aligned */}
          <div className="flex items-center justify-start gap-2 md:gap-4 cursor-pointer md:px-4" onClick={() => navigateTo('/')}>
            <img
              src="/images/logo.png"
              alt="Nivaran Logo"
              className="h-[60px] md:h-[70px] w-auto object-contain flex-shrink-0"
              style={{ height: '60px', maxWidth: 'none' }}
              onError={(e) => {
                // Fallback to original design if logo fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = `
                    <div class="w-[70px] h-[70px] bg-[#DBB520] rounded-full flex items-center justify-center">
                      <span class="text-white font-bold text-3xl">♻️</span>
                    </div>
                    <div>
                      <h1 class="text-3xl font-black text-[#1B4332]" style="font-weight: 900;">Nivaran</h1>
                      <p class="text-base font-bold text-[#1B4332] -mt-1">Upcyclers</p>
                    </div>
                  `;
                }
              }}
            />
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ fontWeight: 900, color: '#1B4332' }}>Nivaran<sup className="text-xs align-top ml-0.5">TM</sup></h1>
              <p className="text-base font-bold tracking-wide" style={{ color: '#2E6F40' }}>Upcyclers</p>
            </div>
          </div>

          {/* Navigation Links - Centered */}
          <nav className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 gap-8">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); navigateTo('/'); }}
              className="text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium text-lg"
            >
              Home
            </a>
            <a
              href="/products"
              onClick={(e) => { e.preventDefault(); navigateTo('/products'); }}
              className="text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium text-lg"
            >
              Shop
            </a>
            <a href="#about" onClick={() => handleNav('about')} className="text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium text-lg">About Us</a>
            <a href="#our-story" onClick={() => handleNav('our-story')} className="text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium text-lg">Our Story</a>
            <a href="#workshops" onClick={() => handleNav('workshops')} className="text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium text-lg">Workshops</a>
            <a href="#contact" onClick={() => handleNav('contact')} className="text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium text-lg">Contact</a>
          </nav>
          {/* Action Icons - Right aligned */}
          <div className="flex gap-8 items-center px-4">
            <button className="text-[#2A2A2A] hover:text-[#DBB520] transition-colors" onClick={() => navigateTo('/products')} title="Search Products">
              <Search className="w-6 h-6" />
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => navigateTo('/dashboard')}
                className="focus:outline-none hover:opacity-80 transition-opacity"
                title="Dashboard"
              >
                <UserAvatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size="sm"
                  className="rounded-full w-9 h-9"
                />
              </button>
            ) : (
              <a
                href="/login"
                onClick={(e) => { e.preventDefault(); navigateTo('/login'); }}
                className="text-[#2A2A2A] hover:text-[#DBB520] transition-colors"
              >
                <User className="w-6 h-6" />
              </a>
            )}
            <a
              href="/cart"
              onClick={(e) => { e.preventDefault(); navigateTo('/cart'); }}
              className="text-[#2A2A2A] hover:text-[#DBB520] transition-colors relative"
            >
              <ShoppingBag className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#F8D548] text-[#2A2A2A] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </a>
            <button
              className="md:hidden text-[#2A2A2A] hover:text-[#DBB520] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Compact Fixed Dropdown */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed left-0 w-full bg-white z-[9999] shadow-2xl border-b border-gray-200"
          style={{
            top: '120px', // 40px top bar + 80px nav
            maxHeight: 'calc(100vh - 140px)',
            overflowY: 'auto',
            backgroundColor: '#ffffff' // Force opaque white
          }}
        >
          <nav className="flex flex-col gap-0 px-6 py-2">
            <button
              onClick={() => { setMobileMenuOpen(false); navigateTo('/'); }}
              className="text-left text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium py-3 border-b border-gray-50"
            >
              Home
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); navigateTo('/products'); }}
              className="text-left text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium py-3 border-b border-gray-50"
            >
              Shop
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); navigateTo('/cart'); }}
              className="text-left text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium py-3 border-b border-gray-50"
            >
              Cart
            </button>
            <button onClick={() => handleNav('about')} className="text-left text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium py-3 border-b border-gray-50">About Us</button>
            <button onClick={() => handleNav('our-story')} className="text-left text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium py-3 border-b border-gray-50">Our Story</button>
            <button onClick={() => handleNav('workshops')} className="text-left text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium py-3 border-b border-gray-50">Workshops</button>
            <button onClick={() => handleNav('contact')} className="text-left text-[#2A2A2A] hover:text-[#DBB520] transition-colors font-medium py-3">Contact</button>
          </nav>
        </div>
      )}

      {/* Category Icons Strip */}
      {showCategories && (
        <div className="border-t border-[#e5e7eb]" style={{ backgroundColor: '#F7F1E5' }}>
          <div className="mx-auto px-4 py-6" style={{ maxWidth: '1200px' }}>
            <div
              className="category-strip"
              style={{
                display: 'grid',
                gridTemplateColumns: loadingCategories || categories.length === 0 ? 'repeat(9, 1fr)' : `repeat(${Math.min(categories.length, 9)}, 1fr)`,
                gap: '1.5rem',
                alignItems: 'start',
                justifyItems: 'center',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <style>{`
                .category-strip::-webkit-scrollbar {
                  display: none;
                }
                
                @media (max-width: 899px) {
                  .category-strip {
                    display: flex !important;
                    flex-wrap: nowrap !important;
                    overflow-x: auto !important;
                    justify-content: start !important;
                    gap: 1rem !important;
                    padding-left: 0.5rem;
                    padding-right: 0.5rem;
                  }
                }
                
                @media (min-width: 900px) {
                  .category-strip {
                    display: grid !important;
                    overflow-x: visible !important;
                  }
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
          </div>
        </div>
      )}
    </header>
  );
}
