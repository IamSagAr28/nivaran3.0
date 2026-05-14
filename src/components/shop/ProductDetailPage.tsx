import React, { useState, useEffect } from 'react'
import { Header } from '../Header'
import { Footer } from '../Footer'
import { useShopCart } from '../../contexts/ShopCartContext'
import { useRouter } from '../../utils/Router'
import { apiUrl, fetchProductById } from '../../utils/shopApi'
import { ShoppingCart, Star, Package, Leaf, Truck, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import '../../styles/ProductDetailPage.css'

interface Product {
  id: string | number
  title: string
  description?: string
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

export default function ProductDetailPage({ params }: { params?: { id?: string } }) {
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

  // Get product ID from props or URL
  const pathId = window.location.pathname.split('/').filter(Boolean).pop() || ''
  const id = params?.id || pathId;

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

            {product.description && (
              <div className="product-description-section">
                <h2 className="product-section-title">About this product</h2>
                <p className="product-description-text">{product.description}</p>
              </div>
            )}

            <div className="product-details-grid">
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
        </div>
      </main>

      <Footer />
    </div>
  )
}
