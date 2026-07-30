import { useEffect, useState, useRef } from 'react';
import { useShopifyProducts } from '../hooks/useShopifyProducts';
import { getOptimizedImageUrl } from '../shopify/client';
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useRouter } from '../utils/Router';
import { fetchProducts, fetchCategories, apiUrl } from '../utils/shopApi';

export function CategoryShowcase() {
  const { products: shopifyProducts } = useShopifyProducts();
  const { navigateTo } = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [backgroundOffset, setBackgroundOffset] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const [productsRes] = await Promise.all([
          fetchProducts({ includeImages: '1' }).catch(() => ({ products: [] })),
        ]);

        const dbProducts = productsRes.products || [];
        const categoryMap = new Map();

        if (dbProducts.length > 0) {
          dbProducts.forEach((p: any) => {
            const catName = p.category || 'Other';
            if (!categoryMap.has(catName)) {
              let img = '';
              if (p.images && p.images.length > 0) {
                img = p.images[0].startsWith('http') || p.images[0].startsWith('data:')
                  ? p.images[0]
                  : apiUrl(`/api/products/${p.id}/media/0`);
              } else {
                img = apiUrl(`/api/products/${p.id}/media/0`);
              }
              categoryMap.set(catName, {
                name: catName,
                productType: catName,
                image: img,
                handle: p.id,
                isIndividualProduct: false
              });
            }
          });
        }

        if (shopifyProducts && shopifyProducts.length > 0) {
          shopifyProducts.forEach((product: any) => {
            const type = product.productType || 'Other';
            if (!categoryMap.has(type)) {
              categoryMap.set(type, {
                name: type,
                productType: type,
                image: product.images?.edges?.[0]?.node?.url || '',
                handle: product.handle,
                isIndividualProduct: false
              });
            }
          });
        }

        let categoriesArray = Array.from(categoryMap.values());

        // Fill up to 4 items with products if less than 4 categories
        if (categoriesArray.length < 4 && dbProducts.length > 0) {
          const existingHandles = new Set(categoriesArray.map(c => String(c.handle)));
          const additional = dbProducts
            .filter((p: any) => !existingHandles.has(String(p.id)))
            .slice(0, 4 - categoriesArray.length)
            .map((p: any) => ({
              name: p.title,
              productType: p.category || 'Other',
              image: p.images && p.images[0] ? (p.images[0].startsWith('http') || p.images[0].startsWith('data:') ? p.images[0] : apiUrl(`/api/products/${p.id}/media/0`)) : apiUrl(`/api/products/${p.id}/media/0`),
              handle: p.id,
              isIndividualProduct: true
            }));
          categoriesArray = [...categoriesArray, ...additional];
        } else if (categoriesArray.length > 4) {
          categoriesArray = categoriesArray.slice(0, 4);
        }

        if (isMounted) {
          setCategories(categoriesArray);
        }
      } catch (err) {
        console.error('CategoryShowcase: Failed to load categories', err);
      }
    }

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [shopifyProducts]);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const sectionHeight = rect.height;

        // Calculate when section is in viewport
        if (rect.bottom > 0 && rect.top < windowHeight) {
          // Calculate how much of the section has scrolled past the viewport
          // When section top is at viewport top: offset = 0
          // As user scrolls down, offset increases (background moves up relative to content)
          const scrollAmount = windowHeight - rect.top;
          const maxScroll = windowHeight + sectionHeight;
          const scrollProgress = Math.max(0, Math.min(1, scrollAmount / maxScroll));

          // Parallax effect: background moves slower than content
          // Negative values move background up (creating parallax effect)
          const parallaxSpeed = 0.3; // Adjust this value (0-1) to control parallax intensity
          const offset = scrollProgress * 30 * parallaxSpeed; // Max 30% movement
          setBackgroundOffset(offset);
        } else if (rect.top >= windowHeight) {
          // Section hasn't entered viewport yet
          setBackgroundOffset(0);
        }
      }
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="products"
      className="py-16 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/products/texture.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: `center ${50 - backgroundOffset}%`,
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        willChange: 'background-position', // Optimize for animations
        paddingTop: 'calc(4rem + 5px)', // py-16 (4rem) + 5px
        paddingBottom: 'calc(4rem + 105px)', // py-16 (4rem) + 5px + 100px extra
      }}
    >
      {/* Content container with relative positioning to ensure cards stay visible */}
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-12">
          <div className="inline-block px-6 py-4 rounded-lg bg-black/40 backdrop-blur-sm">
            <h2
              className="text-3xl mb-3 font-bold text-white"
              style={{
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)',
              }}
            >
              Shop by Category
            </h2>
            <p
              className="font-bold text-white"
              style={{
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)',
              }}
            >
              Explore our diverse range of eco-friendly products
            </p>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <div
                key={category.handle}
                className="group cursor-pointer"
                onClick={() => {
                  console.log('🎯 Category clicked:', {
                    name: category.name,
                    productType: category.productType,
                    isIndividualProduct: (category as any).isIndividualProduct
                  });

                  // If it's an individual product, navigate directly to it
                  if ((category as any).isIndividualProduct) {
                    navigateTo(`/product?handle=${category.handle}`);
                  } else {
                    // Otherwise navigate to products page with category filter
                    navigateTo(`/products?category=${encodeURIComponent(category.productType || category.name)}`);
                  }
                }}
              >
                <div
                  className="aspect-[3/4] bg-white overflow-hidden relative flex flex-col"
                  style={{
                    border: '3px solid white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    borderRadius: '24px',
                  }}
                >
                  <div className="flex-1 relative overflow-hidden" style={{ borderTopLeftRadius: '21px', borderTopRightRadius: '21px' }}>
                    <ImageWithFallback
                      src={getOptimizedImageUrl(category.image, 400, 500)}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ borderTopLeftRadius: '21px', borderTopRightRadius: '21px' }}
                    />
                    {/* Shop Now Overlay */}
                    <div
                      className="absolute bottom-0 left-0 bg-black/60 px-4 py-2 text-white text-sm font-semibold"
                      style={{
                        borderTopRightRadius: '8px',
                      }}
                    >
                      Shop Now →
                    </div>
                  </div>
                  {/* Category Name - Inside the card at the bottom */}
                  <div className="text-center py-3 bg-white">
                    <h3 className="text-lg font-bold text-black">{category.name.toUpperCase()}</h3>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-8 text-[#3a5a40]">
              Loading categories...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
