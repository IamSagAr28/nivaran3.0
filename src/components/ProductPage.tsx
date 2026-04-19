import React, { useState, useEffect, useRef } from 'react';
import { Header } from './Header.tsx';
import { Footer } from './Footer';
import { useRouter } from '../utils/Router';
import { useCart } from '../contexts/CartContext';
import { useShopifyProducts } from '../hooks/useShopifyProducts';
import { formatPrice, getOptimizedImageUrl } from '../shopify/client';
import { ArrowLeft } from 'lucide-react';
import '../styles/ProductPage.css';

export default function ProductPage() {
    const { navigateTo } = useRouter();
    const { addItem, itemCount } = useCart();
    const { products } = useShopifyProducts();
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [quantity, setQuantity] = useState(1);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isStickyBarVisible, setIsStickyBarVisible] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [hasAddedToCart, setHasAddedToCart] = useState(false);

    const actionButtonsRef = useRef<HTMLDivElement>(null);

    // Get product handle from URL query parameters
    const getProductHandle = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('handle');
    };

    const productHandle = getProductHandle();
    const product = products.find(p => p.handle === productHandle);

    useEffect(() => {
        if (product && product.variants.edges.length > 0) {
            setSelectedVariantId(product.variants.edges[0].node.id);
        }
    }, [product]);

    useEffect(() => {
        const handleScroll = () => {
            if (actionButtonsRef.current) {
                const rect = actionButtonsRef.current.getBoundingClientRect();
                if (rect.bottom < 0) {
                    setIsStickyBarVisible(true);
                } else {
                    setIsStickyBarVisible(false);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const changeImage = (direction: number) => {
        if (!product) return;
        const images = product.images.edges;
        let newIndex = currentImageIndex + direction;
        if (newIndex >= images.length) newIndex = 0;
        if (newIndex < 0) newIndex = images.length - 1;
        setCurrentImageIndex(newIndex);
    };

    const addToCart = async () => {
        if (!selectedVariantId) return;
        
        try {
            setIsAdding(true);
            await addItem(selectedVariantId, quantity);
            setHasAddedToCart(true);
            setIsCartOpen(true);
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setIsAdding(false);
        }
    };

    const closeCart = () => {
        setIsCartOpen(false);
        document.body.style.overflow = '';
    };

    const handleQuantityChange = (delta: number) => {
        const newQty = quantity + delta;
        if (newQty >= 1) setQuantity(newQty);
    };

    // Show loading state if product not found
    if (!product) {
        return (
            <>
                <Header showCategories={false} />
                <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <h2>Product not found</h2>
                    <p>The product you're looking for doesn't exist.</p>
                    <button onClick={() => navigateTo('/products')} style={{
                        padding: '10px 24px',
                        backgroundColor: 'var(--fern)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}>
                        Back to Products
                    </button>
                </div>
                <Footer />
            </>
        );
    }

    const images = product.images.edges.map((edge: any) => edge.node.url);
    const selectedVariant = product.variants.edges.find((edge: any) => edge.node.id === selectedVariantId)?.node;

    return (
        <div className="product-page-container">
            <Header showCategories={false} />

            <main className="container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', marginTop: '24px' }}>
                    <button
                        onClick={() => navigateTo('/products')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#588157',
                            color: 'white',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'background-color 0.3s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3a5a40')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#588157')}
                    >
                        <ArrowLeft size={18} />
                        Back to Products
                    </button>
                </div>
                <div className="product-container">
                    {/* Product Image Gallery */}
                    <div className="product-gallery">
                        <div className="product-image-main">
                            {images[currentImageIndex]?.endsWith('.mp4') || images[currentImageIndex]?.startsWith('data:video') ? (
                                <video
                                    id="mainImage" 
                                    src={images[currentImageIndex]}
                                    width="800"
                                    height="800"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <img 
                                    id="mainImage" 
                                    src={getOptimizedImageUrl(images[currentImageIndex], 800, 800)}
                                    alt={product.title}
                                    width="800" 
                                    height="800" 
                                    loading="eager" 
                                />
                            )}
                            <div className="product-badge">Featured</div>
                            <div className="image-carousel-controls">
                                <button className="carousel-btn prev" onClick={() => changeImage(-1)} aria-label="Previous image">❮</button>
                                <button className="carousel-btn next" onClick={() => changeImage(1)} aria-label="Next image">❯</button>
                            </div>
                            <div className="carousel-dots" id="carouselDots">
                                {images.map((_, index) => (
                                    <button 
                                        key={index}
                                        className={`carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentImageIndex(index)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="image-thumbnails">
                            {images.map((img: string, index: number) => (
                                <div 
                                    key={index}
                                    className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`View image ${index + 1}`}
                                    onClick={() => setCurrentImageIndex(index)}
                                    onKeyDown={(e) => { if(e.key === 'Enter') setCurrentImageIndex(index) }}
                                >
                                    {img.endsWith('.mp4') || img.startsWith('data:video') ? (
                                      <video src={img} width="150" height="150" muted playsInline style={{ objectFit: 'cover' }} />
                                    ) : (
                                      <img src={img} alt={`View ${index + 1}`} width="150" height="150" loading="lazy" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="product-info">
                        <p className="product-vendor">{product.vendor}</p>
                        <h1>{product.title}</h1>
                        
                        <div className="product-rating">
                            <span className="stars">★★★★★</span>
                            <span className="rating-value">4.5</span>
                            <button className="rating-count">(156 reviews)</button>
                        </div>

                        <div className="product-price">
                            <span className="price-current">{formatPrice(selectedVariant?.price.amount || '0')}</span>
                            {selectedVariant?.compareAtPrice && (
                                <>
                                    <span className="price-original">{formatPrice(selectedVariant.compareAtPrice.amount)}</span>
                                    <span className="price-discount">
                                        {Math.round((1 - parseFloat(selectedVariant.price.amount) / parseFloat(selectedVariant.compareAtPrice.amount)) * 100)}%
                                    </span>
                                </>
                            )}
                        </div>

                        <p className="product-description">
                            {product.description || 'High-quality eco-friendly product made from sustainable materials.'}
                        </p>

                        {/* Key Benefits */}
                        <div className="key-benefits">
                            <h3>Why Choose This Product?</h3>
                            <ul className="benefits-list">
                                <li><strong>Premium Quality</strong> – Carefully crafted with attention to detail</li>
                                <li><strong>Sustainable Materials</strong> – Made from eco-friendly, upcycled materials</li>
                                <li><strong>Durable & Long-lasting</strong> – Built to withstand regular use</li>
                                <li><strong>Eco-Conscious</strong> – Reduces environmental impact</li>
                                <li><strong>Supports Artisans</strong> – Your purchase helps local craftspeople</li>
                            </ul>
                        </div>

                        {/* Product Options */}
                        <div className="product-options">
                            {product.variants.edges.length > 1 && (
                                <div className="option-group">
                                    <label className="option-label">Variant Options</label>
                                    <div className="option-values">
                                        {product.variants.edges.map((edge: any) => (
                                            <button 
                                                key={edge.node.id}
                                                className={`option-value ${selectedVariantId === edge.node.id ? 'active' : ''}`}
                                                onClick={() => setSelectedVariantId(edge.node.id)}
                                            >
                                                {edge.node.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quantity Selector */}
                        <div className="quantity-selector">
                            <label className="quantity-label">Quantity</label>
                            <div className="quantity-input">
                                <button className="quantity-btn" onClick={() => handleQuantityChange(-1)}>−</button>
                                <input 
                                    type="number" 
                                    value={quantity} 
                                    min="1" 
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                />
                                <button className="quantity-btn" onClick={() => handleQuantityChange(1)}>+</button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons" ref={actionButtonsRef}>
                            {hasAddedToCart ? (
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => navigateTo('/cart')}
                                >
                                    Go to Cart
                                </button>
                            ) : (
                                <button 
                                    className="btn btn-primary" 
                                    onClick={addToCart}
                                    disabled={isAdding || !selectedVariant?.availableForSale}
                                >
                                    {isAdding ? 'Adding...' : 'Add to Cart'}
                                </button>
                            )}
                            <button className="btn btn-secondary" onClick={() => window.location.href = '/cart'}>
                                View Cart
                            </button>
                        </div>

                        {/* Trust Signals */}
                        <div className="trust-signals-box">
                            <h3>Why Shop With Confidence</h3>
                            <div className="trust-signals-grid">
                                <div className="trust-signal-item">
                                    <div className="trust-signal-icon">🚚</div>
                                    <span className="trust-signal-text">Free Shipping on Orders Over Rs. 999</span>
                                </div>
                                <div className="trust-signal-item">
                                    <div className="trust-signal-icon">↩️</div>
                                    <span className="trust-signal-text">Easy Returns & Exchange Within 30 Days</span>
                                </div>
                            </div>
                        </div>

                        {/* Info Footer */}
                        <div className="product-info-footer">
                            <div className="info-item">
                                <div className="info-icon">✓</div>
                                <span className="info-text">Free Shipping on Orders Over Rs. 999</span>
                            </div>
                            <div className="info-item">
                                <div className="info-icon">✓</div>
                                <span className="info-text">Easy Returns & Exchange</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Tabs */}
                <div className="product-tabs">
                    <div className="tab-buttons">
                        {['description', 'features', 'shipping'].map(tab => (
                            <button 
                                key={tab}
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                                style={{textTransform: 'capitalize'}}
                            >
                                {tab === 'features' ? 'Features & Benefits' : tab === 'shipping' ? 'Shipping & Returns' : tab}
                            </button>
                        ))}
                    </div>

                    <div id="description" className={`tab-content ${activeTab === 'description' ? 'active' : ''}`}>
                        <h3 style={{color: 'var(--text-primary)', marginBottom: '16px'}}>Product Description</h3>
                        <p style={{color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '16px'}}>
                            Our Eco-Friendly Cushion Cover is more than just a home décor item – it's a statement about sustainability. Made from carefully selected upcycled pooja waste cloth materials, each cover is hand-crafted with attention to detail and quality.
                        </p>
                        <p style={{color: 'var(--text-secondary)', lineHeight: '1.8'}}>
                            Perfect for adding warmth and personality to any room, these covers are durable, washable, and designed to last. By choosing our cushion covers, you're supporting artisans and helping reduce textile waste in landfills.
                        </p>
                    </div>

                    <div id="features" className={`tab-content ${activeTab === 'features' ? 'active' : ''}`}>
                        <h3 style={{color: 'var(--text-primary)', marginBottom: '16px'}}>Features & Benefits</h3>
                        <ul className="features-list">
                            <li>Made from 100% upcycled materials</li>
                            <li>Hand-crafted with traditional techniques</li>
                            <li>Completely washable and durable</li>
                            <li>Eco-friendly and sustainable</li>
                            <li>Unique patterns and colors</li>
                            <li>Supports artisan communities</li>
                        </ul>
                    </div>

                    <div id="shipping" className={`tab-content ${activeTab === 'shipping' ? 'active' : ''}`}>
                        <h3 style={{color: 'var(--text-primary)', marginBottom: '16px'}}>Shipping & Returns</h3>
                        <p style={{color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '16px'}}>
                            <strong>Shipping:</strong> Free shipping on orders over ₹999. For orders below, ₹150 delivery charge applies. Your items will be carefully packaged and shipped within 2-3 business days.
                        </p>
                        <p style={{color: 'var(--text-secondary)', lineHeight: '1.8'}}>
                            <strong>Returns:</strong> Not satisfied? No problem! We offer easy returns within 30 days of purchase. Items must be unused and in original packaging.
                        </p>
                    </div>
                </div>

                {/* Related Products */}
                <section className="related-products">
                    <h2>You May Also Like</h2>
                    <div className="products-grid">
                        {products
                            .filter((p: any) => p.handle !== productHandle)
                            .slice(0, 4)
                            .map((relatedProduct: any) => {
                                const firstImage = relatedProduct.images.edges[0]?.node.url;
                                const firstVariant = relatedProduct.variants.edges[0]?.node;
                                return (
                                    <div 
                                        className="product-card" 
                                        key={relatedProduct.id}
                                        onClick={() => navigateTo(`/product?handle=${relatedProduct.handle}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img src={getOptimizedImageUrl(firstImage, 300, 300)} alt={relatedProduct.title} className="product-card-image" />
                                        <div className="product-card-info">
                                            <p className="product-card-title">{relatedProduct.title}</p>
                                            <p className="product-card-price">{formatPrice(firstVariant?.price.amount)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </section>
            </main>

            {/* Sticky Cart Bar */}
            <div className={`sticky-cart-bar ${isStickyBarVisible ? 'visible' : ''}`} id="stickyCartBar">
                <div className="sticky-product-info">
                    <img src={images[0]} alt="Product" className="sticky-product-img" />
                    <div className="sticky-product-details">
                        <h4>{product.title}</h4>
                        <p>{formatPrice(selectedVariant?.price.amount || '0')}</p>
                    </div>
                </div>
                <button 
                    className="btn btn-primary" 
                    style={{width: 'auto', padding: '12px 24px'}} 
                    onClick={hasAddedToCart ? () => navigateTo('/cart') : addToCart}
                >
                    {hasAddedToCart ? 'Go to Cart' : 'Add to Cart'}
                </button>
            </div>

            {/* Cart Drawer */}
            <div className={`cart-drawer-overlay ${isCartOpen ? 'open' : ''}`} onClick={closeCart}></div>
            <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h2>Shopping Cart</h2>
                    <button className="close-cart" onClick={closeCart}>×</button>
                </div>
                <div className="cart-items">
                    {/* Cart Item Example */}
                    <div className="cart-item">
                        <img src={images[0]} alt="Product" className="cart-item-img" />
                        <div className="cart-item-details">
                            <h3 className="cart-item-title">{product.title}</h3>
                            <p className="cart-item-variant">{selectedVariant?.title}</p>
                            <div className="cart-item-controls">
                                <div className="quantity-input" style={{border: '1px solid #eee'}}>
                                    <button className="cart-qty-btn" onClick={() => handleQuantityChange(-1)}>−</button>
                                    <input type="text" value={quantity} readOnly style={{width: '30px', height: '24px', fontSize: '13px'}} />
                                    <button className="cart-qty-btn" onClick={() => handleQuantityChange(1)}>+</button>
                                </div>
                                <span className="cart-item-price">{formatPrice(selectedVariant?.price.amount || '0')}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="cart-footer">
                    <div className="cart-subtotal">
                        <span>Subtotal</span>
                        <span>{formatPrice((parseFloat(selectedVariant?.price.amount || '0') * quantity).toString())}</span>
                    </div>
                    <button className="checkout-btn" onClick={() => navigateTo('/cart')}>Proceed to Checkout</button>
                    <p style={{textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '12px'}}>Shipping & taxes calculated at checkout</p>
                </div>
            </div>

            <Footer />
        </div>
    );
}
