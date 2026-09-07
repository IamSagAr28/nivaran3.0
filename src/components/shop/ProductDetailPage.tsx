import React, { useState, useEffect } from 'react'
import { Header } from '../Header'
import { Footer } from '../Footer'
import { useShopCart } from '../../contexts/ShopCartContext'
import { useRouter } from '../../utils/Router'
import { apiUrl, fetchProductById } from '../../utils/shopApi'
import { 
  ShoppingCart, Star, Package, Leaf, Truck, RefreshCw, ChevronLeft, ChevronRight, 
  MapPin, CheckCircle2, Heart, Shield, Award, Sparkles, Check 
} from 'lucide-react'
import { ProductShowcaseSection, WhyChooseUsConfig, WhyChooseUsItem } from '../../types/admin'
import '../../styles/ProductDetailPage.css'

const TARGET_CITIES = [
  'Kanpur',
  'Mumbai',
  'Delhi NCR',
  'Bangalore',
  'Hyderabad',
  'Pune',
  'Lucknow'
];

const CITY_CODE_MAP: Record<string, string> = {
  kn: 'Kanpur',
  kanpur: 'Kanpur',
  mum: 'Mumbai',
  mumbai: 'Mumbai',
  del: 'Delhi NCR',
  delhi: 'Delhi NCR',
  'delhi-ncr': 'Delhi NCR',
  blr: 'Bangalore',
  bangalore: 'Bangalore',
  bengaluru: 'Bangalore',
  hyd: 'Hyderabad',
  hyderabad: 'Hyderabad',
  pune: 'Pune',
  lko: 'Lucknow',
  lucknow: 'Lucknow',
  kol: 'Kolkata',
  kolkata: 'Kolkata',
  jai: 'Jaipur',
  jaipur: 'Jaipur',
  chn: 'Chennai',
  chennai: 'Chennai',
  ahd: 'Ahmedabad',
  ahmedabad: 'Ahmedabad',
  var: 'Varanasi',
  varanasi: 'Varanasi',
};

const CITY_TO_CODE: Record<string, string> = {
  'kanpur': 'kn',
  'mumbai': 'mum',
  'delhi ncr': 'del',
  'delhi': 'del',
  'bangalore': 'blr',
  'hyderabad': 'hyd',
  'pune': 'pune',
  'lucknow': 'lko',
  'kolkata': 'kol',
  'jaipur': 'jai',
  'chennai': 'chn',
  'ahmedabad': 'ahd',
  'varanasi': 'var',
};

interface Product {
  id: string | number
  title: string
  custom_slug?: string
  description?: string
  city_descriptions?: Record<string, string> | string
  showcase_sections?: ProductShowcaseSection[] | string
  city_showcase_sections?: Record<string, ProductShowcaseSection[]> | string
  why_choose_us?: Record<string, WhyChooseUsConfig> | WhyChooseUsConfig | string
  price: number
  compare_at_price?: number
  images: string[]
  category: string
  variants?: Array<{ attributes: Record<string, string>; price: number; stock: number }>
  variant_types?: Array<{ name: string; options: string[] }>
  colors?: string[] // legacy
  material: string
  stock: number
  featured: number
  created_at?: string
}

export default function ProductDetailPage({ params }: { params?: { id?: string; cityCode?: string; slug?: string } }) {
  const { addToCart } = useShopCart()
  const { navigateTo } = useRouter()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [selectedLegacyColor, setSelectedLegacyColor] = useState('')
  const [selectedCity, setSelectedCity] = useState<string>('')

  // Determine city & product identifier from URL / params
  const pathSegments = window.location.pathname.split('/').filter(Boolean)
  const isCityRoute = Boolean(params?.cityCode || (pathSegments.length >= 2 && CITY_CODE_MAP[pathSegments[0]?.toLowerCase()]))
  const detectedCityCode = (params?.cityCode || (isCityRoute ? pathSegments[0] : '')).toLowerCase()
  const detectedSlug = params?.slug || (isCityRoute ? pathSegments[1] : (params?.id || pathSegments[pathSegments.length - 1] || ''))

  const id = detectedSlug;

  // Parse city from URL route param, query param, or local storage
  useEffect(() => {
    if (detectedCityCode && CITY_CODE_MAP[detectedCityCode]) {
      const cityName = CITY_CODE_MAP[detectedCityCode];
      setSelectedCity(cityName);
      try { localStorage.setItem('preferred_city', cityName); } catch {}
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const cityParam = searchParams.get('city');
    if (cityParam) {
      const normalizedParam = cityParam.toLowerCase().replace(/[-_]/g, ' ').trim();
      const matched = TARGET_CITIES.find(
        c => c.toLowerCase() === normalizedParam || c.toLowerCase().replace(/\s+/g, '') === normalizedParam.replace(/\s+/g, '')
      );
      if (matched) {
        setSelectedCity(matched);
        return;
      }
    }
    const saved = localStorage.getItem('preferred_city');
    if (saved && TARGET_CITIES.includes(saved)) {
      setSelectedCity(saved);
    }
  }, [detectedCityCode]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    try {
      if (city) {
        localStorage.setItem('preferred_city', city);
        if (product) {
          const code = CITY_TO_CODE[city.toLowerCase()] || city.toLowerCase().slice(0, 3);
          const baseSlug = (product.custom_slug || product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/-+$/, '');
          const citySlugPart = city.toLowerCase().replace(/\s+/g, '-');
          navigateTo(`/${code}/${baseSlug}-in-${citySlugPart}`);
          return;
        }
      } else {
        localStorage.removeItem('preferred_city');
        if (product) {
          navigateTo(`/product/${product.id}`);
          return;
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (!id) return
    fetchProductById(id)
      .then(p => {
        setProduct(p)
        if (p.variant_types && p.variant_types.length > 0 && p.variants && p.variants.length > 0) {
          // New variant system map
          // Find first available variant
          let defaultVariant = p.variants.find((v: any) => Number(v?.stock ?? 0) > 0) || p.variants[0];
          setSelectedAttributes(defaultVariant.attributes || {});
        } else if (Array.isArray(p.variants) && p.variants.length && p.variants[0].color) {
          // Transitional variants (e.g. variants array with just {color, stock})
          const firstAvailable = p.variants.find((v: any) => Number(v?.stock ?? 0) > 0);
          setSelectedLegacyColor(firstAvailable?.color || p.variants[0]?.color || '')
        } else if (p.colors?.length) {
          // Pure legacy colors array
          setSelectedLegacyColor(p.colors[0])
        }
      })
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false))
  }, [id])

  // Dynamic SEO Meta Tags & Schema.org Local Product Data
  useEffect(() => {
    if (!product) return;
    const originalTitle = document.title;
    const citySuffix = selectedCity ? ` in ${selectedCity}` : '';
    document.title = `${product.title}${citySuffix} | Eco-Friendly Upcycled Products | Nivaran`;

    // Meta description update
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const oldDesc = metaDesc.getAttribute('content');
    const newDesc = selectedCity
      ? `Buy ${product.title} in ${selectedCity}. 100% sustainable, handmade upcycled eco-friendly products delivered across ${selectedCity} with fast shipping by Nivaran.`
      : (product.description || `Discover ${product.title} - eco-friendly handcrafted sustainable creations from Nivaran.`);
    metaDesc.setAttribute('content', newDesc);

    // Canonical link update
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href.split('?')[0]);

    // JSON-LD Schema markup for Google Rich Snippets
    let schemaScript = document.getElementById('product-schema-jsonld') as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'product-schema-jsonld';
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    const schemaData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: `${product.title}${citySuffix}`,
      image: Array.isArray(product.images) && product.images.length > 0 ? product.images : undefined,
      description: newDesc,
      brand: {
        '@type': 'Brand',
        name: 'Nivaran Upcyclers'
      },
      offers: {
        '@type': 'Offer',
        url: window.location.href,
        priceCurrency: 'INR',
        price: product.price,
        availability: (product.stock || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        ...(selectedCity ? {
          eligibleRegion: {
            '@type': 'City',
            name: selectedCity
          }
        } : {})
      }
    };
    schemaScript.textContent = JSON.stringify(schemaData);

    return () => {
      document.title = originalTitle;
      if (oldDesc) metaDesc?.setAttribute('content', oldDesc);
      if (schemaScript && schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript);
      }
    };
  }, [product, selectedCity]);

  // Automatic clean URL upgrade: if user visits /product/198?city=kanpur or /product/198 while city is chosen,
  // silently upgrade browser URL to clean SEO route /kn/product-slug-in-kanpur
  useEffect(() => {
    if (!product || !selectedCity) return;
    const currentPath = window.location.pathname;
    const search = window.location.search;

    if (currentPath.startsWith('/product/') || search.includes('city=')) {
      const code = CITY_TO_CODE[selectedCity.toLowerCase()] || 'kn';
      const baseSlug = (product.custom_slug || product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/-+$/, '');
      const citySlugPart = selectedCity.toLowerCase().replace(/\s+/g, '-');
      const cleanUrl = `/${code}/${baseSlug}-in-${citySlugPart}`;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [product, selectedCity]);

  const currentVariant = React.useMemo(() => {
    if (!product || !product.variants) return null;
    
    // Look for new variant format using attributes
    if (Object.keys(selectedAttributes).length > 0) {
      return product.variants.find(v => {
        if (!v.attributes) return false;
        return Object.keys(selectedAttributes).every(k => v.attributes[k] === selectedAttributes[k]);
      });
    }
    
    // Fallback to legacy color variant
    if (selectedLegacyColor) {
      return product.variants.find((v: any) => v.color === selectedLegacyColor);
    }
    
    return null;
  }, [product, selectedAttributes, selectedLegacyColor]);

  const parsedCityDescriptions = React.useMemo<Record<string, string>>(() => {
    if (!product?.city_descriptions) return {};
    if (typeof product.city_descriptions === 'string') {
      try {
        return JSON.parse(product.city_descriptions);
      } catch {
        return {};
      }
    }
    if (typeof product.city_descriptions === 'object' && product.city_descriptions !== null) {
      return product.city_descriptions;
    }
    return {};
  }, [product]);

  const activeDescription = React.useMemo(() => {
    if (selectedCity && parsedCityDescriptions[selectedCity]?.trim()) {
      return parsedCityDescriptions[selectedCity].trim();
    }
    return product?.description || '';
  }, [selectedCity, parsedCityDescriptions, product]);

  const isCityCustomized = Boolean(selectedCity && parsedCityDescriptions[selectedCity]?.trim());

  // Parse showcase_sections
  const parsedGlobalShowcase = React.useMemo<ProductShowcaseSection[]>(() => {
    if (!product?.showcase_sections) return [];
    if (typeof product.showcase_sections === 'string') {
      try { return JSON.parse(product.showcase_sections); } catch { return []; }
    }
    return Array.isArray(product.showcase_sections) ? product.showcase_sections : [];
  }, [product]);

  const parsedCityShowcaseMap = React.useMemo<Record<string, ProductShowcaseSection[]>>(() => {
    if (!product?.city_showcase_sections) return {};
    if (typeof product.city_showcase_sections === 'string') {
      try { return JSON.parse(product.city_showcase_sections); } catch { return {}; }
    }
    return typeof product.city_showcase_sections === 'object' ? product.city_showcase_sections : {};
  }, [product]);

  const activeShowcaseSections = React.useMemo<ProductShowcaseSection[]>(() => {
    if (selectedCity && parsedCityShowcaseMap[selectedCity]?.length) {
      return parsedCityShowcaseMap[selectedCity];
    }
    return parsedGlobalShowcase;
  }, [selectedCity, parsedCityShowcaseMap, parsedGlobalShowcase]);

  // Parse why_choose_us
  const parsedWhyChooseMap = React.useMemo<Record<string, WhyChooseUsConfig>>(() => {
    if (!product?.why_choose_us) return {};
    if (typeof product.why_choose_us === 'string') {
      try { return JSON.parse(product.why_choose_us); } catch { return {}; }
    }
    if (typeof product.why_choose_us === 'object' && product.why_choose_us !== null) {
      return product.why_choose_us as Record<string, WhyChooseUsConfig>;
    }
    return {};
  }, [product]);

  const activeWhyChoose = React.useMemo<WhyChooseUsConfig>(() => {
    if (selectedCity && parsedWhyChooseMap[selectedCity]) {
      return parsedWhyChooseMap[selectedCity];
    }
    if (parsedWhyChooseMap['default']) {
      return parsedWhyChooseMap['default'];
    }
    // Built-in rich default
    return {
      tag: selectedCity ? `Why Choose Us in ${selectedCity}` : 'Why Choose Nivaran',
      title: selectedCity ? `Why ${selectedCity} Chooses Nivaran Handicrafts` : 'Why Choose Nivaran Handicrafts?',
      subtitle: 'Devotion that lives on — 100% handmade, sustainable seed paper items that bloom into plants.',
      description: selectedCity 
        ? `Directly supporting skilled women artisans while delivering eco-friendly sacred items straight to your home in ${selectedCity}.`
        : 'Every product is consciously crafted from recycled cotton scrap paper and infused with viable organic seeds.',
      items: [
        {
          icon: 'leaf',
          title: '100% Plantable Seed Paper',
          description: 'Embedded with live seeds that sprout into vibrant basil & marigold plants when placed in soil.'
        },
        {
          icon: 'heart',
          title: 'Handcrafted by Women Artisans',
          description: 'Creating sustainable rural livelihoods and keeping traditional eco-friendly craftsmanship alive.'
        },
        {
          icon: 'shield',
          title: 'Zero Waste & Chemical-Free',
          description: 'Non-toxic, organic natural dyes and recycled paper with zero harmful chemical residues.'
        },
        {
          icon: 'truck',
          title: selectedCity ? `Safe Delivery to ${selectedCity}` : 'Safe Plastic-Free Delivery',
          description: 'Thoughtfully packed with 100% recyclable, plastic-free packaging directly to your doorstep.'
        }
      ]
    };
  }, [selectedCity, parsedWhyChooseMap]);

  const renderBenefitIcon = (iconName?: string) => {
    switch (iconName) {
      case 'leaf': return <Leaf className="benefit-card-icon" />;
      case 'heart': return <Heart className="benefit-card-icon" />;
      case 'shield': return <Shield className="benefit-card-icon" />;
      case 'truck': return <Truck className="benefit-card-icon" />;
      case 'award': return <Award className="benefit-card-icon" />;
      case 'star': return <Star className="benefit-card-icon" />;
      case 'package': return <Package className="benefit-card-icon" />;
      default: return <Leaf className="benefit-card-icon" />;
    }
  };

  const whyChooseSliderRef = React.useRef<HTMLDivElement>(null);

  const slideWhyChoose = (direction: 'left' | 'right') => {
    if (whyChooseSliderRef.current) {
      const containerWidth = whyChooseSliderRef.current.clientWidth;
      const scrollStep = containerWidth >= 1024 ? containerWidth * 0.75 : containerWidth * 0.85;
      const scrollAmount = direction === 'left' ? -scrollStep : scrollStep;
      whyChooseSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleAddToCart = () => {
    if (!product) return

    // Figure out variant description for cart
    let variantDescription = '';
    if (Object.keys(selectedAttributes).length > 0) {
      variantDescription = Object.values(selectedAttributes).join(', ');
    } else if (selectedLegacyColor) {
      variantDescription = selectedLegacyColor;
    }

    addToCart({
      productId: String(product.id),
      title: product.title,
      price: currentVariant?.price ?? product.price,
      // Fallback display logic for cart item image: We directly use the preview if available
      image: product.images?.[0] && !product.images[0].startsWith('data:video') ? product.images[0] : (product.images?.[0] || ''),
      category: product.category,
      material: product.material,
      variantColor: variantDescription || undefined,
      quantity: qty,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    if (!product) return
    handleAddToCart()
    // Wait for state update to complete before navigating
    setTimeout(() => navigateTo('/shop-cart'), 100)
  }

  const prevImage = () => setSelectedImage(i => Math.max(0, i - 1))
  const nextImage = () => setSelectedImage(i => Math.min((product?.images?.length || 1) - 1, i + 1))

  if (loading) {
    return (
      <div className="product-detail-page">
        <Header showCategories={false} />
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <Header showCategories={false} />
        <div className="error-container">
          <p className="error-text">😔 {error || 'Product not found.'}</p>
          <button onClick={() => navigateTo('/products')} className="btn btn-primary">
            Back to Shop
          </button>
        </div>
        <Footer />
      </div>
    )
  }

  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : null

  // Determine stock based on matching variant
  const selectedVariantStock = currentVariant 
    ? Number(currentVariant.stock ?? 0)
    : Number(product.stock || 0)
    
  // Display price based on matching variant
  const displayPrice = currentVariant?.price ?? product.price;

  return (
    <div className="product-detail-page">
      <Header showCategories={false} />

      <main className="product-detail-main">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <button onClick={() => navigateTo('/')} className="breadcrumb-item">Home</button>
          <span className="breadcrumb-separator">/</span>
          <button onClick={() => navigateTo('/products')} className="breadcrumb-item">Shop</button>
          <span className="breadcrumb-separator">/</span>
          <button onClick={() => navigateTo(`/products?category=${encodeURIComponent(product.category)}`)} className="breadcrumb-item">{product.category}</button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.title}</span>
        </nav>

        <div className="product-detail-container">
          {/* Media */}
          <section className="product-media">
            <div className="product-image-wrapper">
              <div className="product-image-main">
                {product.images?.length > 0 ? (
                  <>
                    {product.images[selectedImage].endsWith('.mp4') || product.images[selectedImage].startsWith('data:video') ? (
                      <video
                        src={product.images[selectedImage]}
                        className="product-media-element"
                        controls
                        playsInline
                      />
                    ) : (
                      <img
                        src={product.images[selectedImage]}
                        alt={product.title}
                        className="product-media-element"
                      />
                    )}

                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          disabled={selectedImage === 0}
                          className="carousel-btn carousel-btn-prev"
                        >
                          <ChevronLeft className="carousel-icon" />
                        </button>
                        <button
                          onClick={nextImage}
                          disabled={selectedImage === product.images.length - 1}
                          className="carousel-btn carousel-btn-next"
                        >
                          <ChevronRight className="carousel-icon" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="product-empty-state">
                    <Package className="empty-icon" />
                    <span>No media</span>
                  </div>
                )}

                {discount && (
                  <span className="product-discount-badge">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {product.images?.length > 1 && (
                <div className="product-thumbnails">
                  {product.images.map((media, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`product-thumbnail ${selectedImage === i ? 'active' : ''}`}
                    >
                      {media.endsWith('.mp4') || media.startsWith('data:video') ? (
                        <video src={media} muted playsInline />
                      ) : (
                        <img src={media} alt={`View ${i + 1}`} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Info */}
          <section className="product-info-section">
            <div className="product-actions-buttons">
              <button
                onClick={handleAddToCart}
                disabled={selectedVariantStock === 0 || (product.variant_types && product.variant_types.length > 0 && Object.keys(selectedAttributes).length !== product.variant_types.length)}
                className={`btn btn-primary ${added ? 'btn-success' : ''}`}
              >
                <ShoppingCart className="btn-icon" />
                {added ? 'Added to Cart' : 'Add to Cart'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={selectedVariantStock === 0 || (product.variant_types && product.variant_types.length > 0 && Object.keys(selectedAttributes).length !== product.variant_types.length)}
                className="btn btn-secondary"
              >
                Buy Now
              </button>
            </div>

            <div className="product-header">
              <div className="product-badges">
                <span className="product-category">{product.category}</span>
                {product.featured === 1 && (
                  <span className="product-featured-badge">
                    <Star className="badge-icon" /> Featured
                  </span>
                )}
              </div>
              <h1 className="product-title">{product.title}</h1>

              <div className="product-pricing">
                <span className="product-price">₹{displayPrice.toFixed(2)}</span>
                {product.compare_at_price && product.compare_at_price > displayPrice && (
                  <span className="product-original-price">₹{product.compare_at_price.toFixed(2)}</span>
                )}
              </div>
            </div>

            <div className="product-stock-status">
              <div className={`stock-indicator ${selectedVariantStock > 0 ? 'in-stock' : 'out-of-stock'}`} />
              <span className={`stock-text ${selectedVariantStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {selectedVariantStock > 0 ? `In Stock (${selectedVariantStock})` : 'Out of Stock'}
              </span>
            </div>

            {/* Render New Dynamic Variants UI */}
            {product.variant_types && product.variant_types.length > 0 ? (
              <div className="product-variants-container" style={{ marginTop: '20px' }}>
                {product.variant_types.map((vt) => (
                  <div key={vt.name} className="product-option-group" style={{ marginBottom: '15px' }}>
                    <label className="product-option-label">
                      {vt.name}: <span className="option-value-text">{selectedAttributes[vt.name] || ''}</span>
                    </label>
                    <div className="product-option-values">
                      {vt.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setSelectedAttributes(prev => ({ ...prev, [vt.name]: opt }))}
                          className={`product-option-btn ${selectedAttributes[vt.name] === opt ? 'active' : ''}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Render Legacy Colors UI if no new variants exist
              (product.colors || []).length > 0 && (
                <div className="product-option-group">
                  <label className="product-option-label">Color: <span className="option-value-text">{selectedLegacyColor}</span></label>
                  <div className="product-option-values">
                    {(product.colors || []).map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedLegacyColor(color)}
                        className={`product-option-btn ${selectedLegacyColor === color ? 'active' : ''}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}

            {selectedVariantStock > 0 && (
              <div className="product-quantity-section">
                <label className="product-option-label">Quantity</label>
                <div className="quantity-control">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="quantity-btn"
                  >
                    −
                  </button>
                  <span className="quantity-value">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(selectedVariantStock, q + 1))}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

          </section>
        </div>

        {/* ========================================================================= */}
        {/* FULL SCREEN / FULL WIDTH "ABOUT THIS PRODUCT" SECTION */}
        {/* ========================================================================= */}
        <section className="product-about-fullscreen-section">
          {/* City Selector for SEO & Localized Details */}
          <div className="product-city-selector-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#DBB520" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                  Select Your City:
                </span>
              </div>
              {selectedCity && isCityCustomized && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#15803d',
                  background: '#dcfce7',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  border: '1px solid #bbf7d0'
                }}>
                  ✨ {selectedCity} Edition Details Available
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleCityChange('')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: !selectedCity ? 600 : 500,
                  border: !selectedCity ? '1.5px solid #DBB520' : '1px solid #cbd5e1',
                  background: !selectedCity ? '#fefce8' : '#ffffff',
                  color: !selectedCity ? '#854d0e' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                All India (Default)
              </button>
              {TARGET_CITIES.map(city => {
                const isSelected = selectedCity === city;
                const hasCustom = Boolean(parsedCityDescriptions[city]?.trim());
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCityChange(city)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 500,
                      border: isSelected ? '1.5px solid #DBB520' : '1px solid #cbd5e1',
                      background: isSelected ? '#fefce8' : '#ffffff',
                      color: isSelected ? '#854d0e' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {city}
                    {hasCustom && (
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        display: 'inline-block'
                      }} title="Custom description available for this city" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {activeDescription && (
            <div className="product-description-fullscreen">
              <div className="about-fullscreen-header">
                <span className="about-fullscreen-badge">
                  <Sparkles size={13} /> Product Details
                </span>
                <h2 className="about-fullscreen-title">
                  About this product {selectedCity ? `(${selectedCity})` : ''}
                </h2>
              </div>
              <p className="about-fullscreen-text">{activeDescription}</p>
            </div>
          )}

          <div className="product-details-grid-fullscreen">
            <div className="product-detail-item">
              <Leaf className="detail-icon" />
              <div>
                <p className="detail-label">Material</p>
                <p className="detail-value">{product.material || 'Natural & Sustainable'}</p>
              </div>
            </div>

            <div className="product-detail-item">
              <Truck className="detail-icon" />
              <div>
                <p className="detail-label">Delivery</p>
                <p className="detail-value">Ships in 3-7 business days</p>
              </div>
            </div>

            <div className="product-detail-item">
              <RefreshCw className="detail-icon" />
              <div>
                <p className="detail-label">Returns</p>
                <p className="detail-value">7-day easy return policy</p>
              </div>
            </div>

            <div className="product-detail-item">
              <Package className="detail-icon" />
              <div>
                <p className="detail-label">Eco-Packed</p>
                <p className="detail-value">100% plastic-free packaging</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Image & Content Showcase Sections (Product Stories) */}
        {activeShowcaseSections.filter(s => (s.title && s.title.trim().length > 0) || (s.description && s.description.trim().length > 0)).length > 0 && (
          <section className="product-showcase-container">
            <div className="showcase-header-title">
              <span className="showcase-badge">
                <Sparkles size={14} /> Artisan Craft & Sustainable Details
              </span>
              <h2>Discover What Makes This Creation Special</h2>
              {selectedCity && (
                <p className="showcase-header-subtitle">
                  Tailored with devotion for our patrons in <strong>{selectedCity}</strong> & across India.
                </p>
              )}
            </div>

            <div className="product-showcase-list">
              {activeShowcaseSections
                .filter(s => (s.title && s.title.trim().length > 0) || (s.description && s.description.trim().length > 0))
                .map((sec, idx) => {
                  const isImageRight = sec.layout === 'image-right' || (idx % 2 === 1 && sec.layout !== 'image-left');
                  return (
                    <div 
                      key={sec.id || idx} 
                      className={`showcase-row ${isImageRight ? 'row-image-right' : 'row-image-left'}`}
                    >
                      <div className="showcase-media-col">
                        <div className="showcase-image-card">
                          {sec.image ? (
                            <img 
                              src={sec.image} 
                              alt={sec.imageAlt || sec.title || `Product story view ${idx + 1}`} 
                              loading="lazy" 
                            />
                          ) : (
                            <div className="showcase-empty-img">
                              <Package size={44} color="#94a3b8" />
                              <span>Handcrafted Creation</span>
                            </div>
                          )}
                          {sec.tag && (
                            <span className="showcase-image-pill">{sec.tag}</span>
                          )}
                        </div>
                      </div>

                      <div className="showcase-content-col">
                        {sec.tag && <span className="showcase-tag">{sec.tag}</span>}
                        {sec.title && <h3 className="showcase-title">{sec.title}</h3>}
                        {sec.description && <p className="showcase-description">{sec.description}</p>}
                        
                        {sec.bullets && sec.bullets.length > 0 && (
                          <ul className="showcase-bullets">
                            {sec.bullets.filter(Boolean).map((bullet, bIdx) => (
                              <li key={bIdx}>
                                <CheckCircle2 className="bullet-icon" size={18} />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Dynamic "Why Choose Us" Section */}
        <section className="product-why-choose-section">
          <div className="why-choose-inner">
            <div className="why-choose-header">
              {activeWhyChoose.tag && (
                <span className="why-choose-badge">
                  <Sparkles size={14} /> {activeWhyChoose.tag}
                </span>
              )}
              <h2 className="why-choose-title">{activeWhyChoose.title}</h2>
              {activeWhyChoose.subtitle && (
                <p className="why-choose-subtitle">{activeWhyChoose.subtitle}</p>
              )}
              {activeWhyChoose.description && (
                <p className="why-choose-narrative">{activeWhyChoose.description}</p>
              )}
            </div>

            <div className="why-choose-slider-container">
              {(activeWhyChoose.items || []).length > 4 && (
                <button
                  type="button"
                  className="why-choose-nav-btn prev"
                  onClick={() => slideWhyChoose('left')}
                  aria-label="Previous cards"
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              <div className="why-choose-cards-slider" ref={whyChooseSliderRef}>
                {(activeWhyChoose.items || []).map((item, idx) => (
                  <div key={idx} className="why-choose-card">
                    <div className="why-choose-icon-wrapper">
                      {renderBenefitIcon(item.icon)}
                    </div>
                    <h4 className="why-choose-card-title">{item.title}</h4>
                    <p className="why-choose-card-desc">{item.description}</p>
                  </div>
                ))}
              </div>

              {(activeWhyChoose.items || []).length > 4 && (
                <button
                  type="button"
                  className="why-choose-nav-btn next"
                  onClick={() => slideWhyChoose('right')}
                  aria-label="Next cards"
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
