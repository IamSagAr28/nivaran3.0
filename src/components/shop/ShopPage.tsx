import React, { useState, useEffect, useMemo } from 'react'
import { Header } from '../Header'
import { Footer } from '../Footer'
import { useShopCart } from '../../contexts/ShopCartContext'
import { useRouter } from '../../utils/Router'
import { apiUrl, fetchProducts, fetchCategories } from '../../utils/shopApi'


interface Product {
  id: string | number
  title: string
  price: number
  compare_at_price?: number
  images: string[]
  category: string
  colors: string[]
  material: string
  stock: number
  featured: number
  description?: string
  createdAt?: string
  created_at?: string
}

export default function ShopPage() {
  const { addToCart } = useShopCart()
  const { navigateTo } = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sort, setSort] = useState('newest')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(10000)
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all')
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cat = params.get('category')
    if (cat) setSelectedCategory(decodeURIComponent(cat))

    Promise.all([fetchProducts(), fetchCategories()])
      .then(([productsData, categoriesData]) => {
        setProducts(productsData.products || [])
        setCategories(['All', ...(categoriesData.categories || [])])
      })
      .catch(() => setError('Failed to load products. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const maxProductPrice = useMemo(() =>
    products.length > 0 ? Math.max(...products.map(p => p.price)) : 10000, [products])

  useEffect(() => {
    if (maxProductPrice > 0) setMaxPrice(maxProductPrice)
  }, [maxProductPrice])

  const filtered = useMemo(() => {
    let list = [...products]
    if (selectedCategory !== 'All') list = list.filter(p => p.category === selectedCategory)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q)
      )
    }
    list = list.filter(p => p.price >= minPrice && p.price <= maxPrice)
    if (stockFilter === 'in') list = list.filter(p => p.stock > 0)
    if (stockFilter === 'out') list = list.filter(p => p.stock === 0)
    
    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price)
    else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price)
    else list.sort((a, b) => new Date(b.created_at || b.createdAt || '').getTime() - new Date(a.created_at || a.createdAt || '').getTime())
    
    return list
  }, [products, selectedCategory, search, minPrice, maxPrice, sort, stockFilter])

  const handleAddToCart = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation()
    addToCart({
      id: String(p.id),
      title: p.title,
      price: p.price,
      image: apiUrl(`/api/products/${p.id}/media/0`),
      category: p.category,
      material: p.material,
    })
    const id = String(p.id)
    setAddedIds(prev => new Set([...prev, id]))
    setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(id); return s }), 1500)
  }

  return (
    <div className="min-h-screen shop-page">
      <Header showCategories={false} />

      {/* Top Banner */}
      <div className="shop-hero">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="hero-content">
            <div>
              <p className="hero-kicker">NIVARAN UPCYCLERS</p>
              <h1 className="hero-title">Shop Products</h1>
              <p className="hero-sub">Modern upcycled essentials, crafted by artisans.</p>
            </div>
            <div className="hero-pill">Free shipping above ₹999</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="shop-layout">
          {/* Filters */}
          <aside className="filter-panel">
            <div className="filter-card">
              <div className="filter-block">
                <label className="filter-label">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products"
                  className="filter-input"
                />
              </div>

              <div className="filter-block">
                <div className="filter-heading">Product Type</div>
                <div className="filter-list">
                  {categories.map(cat => (
                    <label key={cat} className="filter-item">
                      <input
                        type="checkbox"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-block">
                <div className="filter-heading">Price Range</div>
                <div className="filter-row">
                  <input
                    type="number"
                    min="0"
                    max={maxProductPrice}
                    value={minPrice}
                    onChange={e => setMinPrice(Number(e.target.value) || 0)}
                    placeholder="Min"
                    className="filter-mini"
                  />
                  <input
                    type="number"
                    min="0"
                    max={maxProductPrice}
                    value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    placeholder="Max"
                    className="filter-mini"
                  />
                </div>
              </div>

              <div className="filter-block">
                <div className="filter-heading">Availability</div>
                <label className="filter-item">
                  <input
                    type="radio"
                    name="stock"
                    checked={stockFilter === 'all'}
                    onChange={() => setStockFilter('all')}
                  />
                  <span>All Products</span>
                </label>
                <label className="filter-item">
                  <input
                    type="radio"
                    name="stock"
                    checked={stockFilter === 'in'}
                    onChange={() => setStockFilter('in')}
                  />
                  <span>In Stock</span>
                </label>
                <label className="filter-item">
                  <input
                    type="radio"
                    name="stock"
                    checked={stockFilter === 'out'}
                    onChange={() => setStockFilter('out')}
                  />
                  <span>Sold Out</span>
                </label>
              </div>

              <div className="filter-actions">
                <button className="filter-apply">Apply Filters</button>
                <button
                  onClick={() => { setSearch(''); setSelectedCategory('All'); setMinPrice(0); setMaxPrice(maxProductPrice); setStockFilter('all'); }}
                  className="filter-clear"
                >
                  Clear All
                </button>
              </div>
            </div>
          </aside>

          {/* Products */}
          <main>
            <div className="toolbar">
              <div className="toolbar-left">Showing {filtered.length} products</div>
              <div className="toolbar-right">
                <span>Sort by</span>
                <select value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="newest">Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="error-banner">{error}</div>
            )}

            {loading ? (
              <div className="skeleton-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-img"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <p>No products found</p>
                <span>Try adjusting your filters or search terms.</span>
              </div>
            ) : (
              <div className="product-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                {filtered.map((p, index) => (
                  <div key={p.id} className="product-card" style={{ animationDelay: `${index * 40}ms` }}>
                    <div
                      onClick={() => navigateTo(`/product/${p.id}`)}
                      className="product-media"
                    >
                      <img
                        src={apiUrl(`/api/products/${p.id}/media/0`)}
                        alt={p.title}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23E5E5E5" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="24" fill="%23999"%3E🌿%3C/text%3E%3C/svg%3E'
                        }}
                      />
                      {p.stock === 0 && (
                        <div className="stock-overlay">Out of Stock</div>
                      )}
                    </div>

                    <div className="product-body">
                      <div className="product-meta">{p.category}</div>
                      <div className="product-title">{p.title}</div>
                      <div className="product-price">₹{p.price.toFixed(0)}</div>
                      <div className="product-sub">{p.colors?.length || 0} colours / {p.material}</div>
                      <div className="product-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddToCart(e, p)
                          }}
                          disabled={p.stock === 0}
                          className={`btn-primary ${p.stock === 0 ? 'btn-disabled' : addedIds.has(String(p.id)) ? 'btn-added' : ''}`}
                        >
                          {addedIds.has(String(p.id)) ? 'Added' : 'Add to Cart'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigateTo(`/product/${p.id}`); }}
                          className="btn-secondary"
                        >
                          View Details
                        </button>
                      </div>
                      <div className="product-brand">NIVARAN UPCYCLERS</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <div className="footer-spacer" />
      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

        .shop-page {
          font-family: 'Manrope', sans-serif;
          background: #f6f6f6;
          color: #111827;
        }

        .shop-hero {
          background: linear-gradient(135deg, #fff2c2 0%, #fff8dd 45%, #ffffff 100%);
          border-bottom: 1px solid #f0e4bf;
        }

        .hero-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .shop-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .hero-kicker {
          font-size: 11px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: #8a6d00;
          font-weight: 700;
        }

        .hero-title {
          font-size: 30px;
          font-weight: 800;
          color: #111827;
        }

        .hero-sub {
          font-size: 14px;
          color: #5f6368;
          margin-top: 4px;
        }

        .hero-pill {
          background: #111827;
          color: #ffffff;
          font-size: 12px;
          padding: 10px 18px;
          border-radius: 999px;
          width: fit-content;
          box-shadow: 0 10px 24px rgba(17, 24, 39, 0.25);
        }

        .footer-spacer {
          height: 24px;
        }

        .filter-panel {
          position: sticky;
          top: 18px;
          align-self: start;
        }

        .filter-card {
          background: #ffffff;
          border: 1px solid #ececec;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 12px 24px rgba(0,0,0,0.05);
        }

        .filter-block { margin-bottom: 18px; }

        .filter-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6b7280;
        }

        .filter-input {
          margin-top: 8px;
          width: 100%;
          border: 1px solid #e5e7eb;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
        }

        .filter-heading {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #111827;
          margin-bottom: 10px;
          letter-spacing: 0.14em;
        }

        .filter-list {
          max-height: 220px;
          overflow-y: auto;
          display: grid;
          gap: 8px;
        }

        .filter-item {
          display: flex;
          gap: 8px;
          font-size: 13px;
          color: #111827;
          align-items: center;
        }

        .filter-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .filter-mini {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 12px;
        }

        .filter-actions {
          display: grid;
          gap: 8px;
          border-top: 1px solid #f0f0f0;
          padding-top: 12px;
        }

        .filter-apply {
          background: #111827;
          color: #ffffff;
          padding: 10px 12px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 12px;
        }

        .filter-clear {
          border: 1px solid #111827;
          color: #111827;
          background: #ffffff;
          padding: 10px 12px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 12px;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          border: 1px solid #ececec;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 18px;
        }

        .toolbar-right {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .toolbar-right select {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 12px;
        }

        .error-banner {
          background: #ffecec;
          border: 1px solid #f4baba;
          color: #b42318;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .product-card {
          background: #ffffff;
          border: 1px solid #ededed;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
          animation: fadeUp 0.35s ease both;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 30px rgba(0,0,0,0.08);
        }

        .product-media {
          height: 240px;
          background: #f1f1f1;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .product-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .media-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 40px;
          opacity: 0.4;
        }

        .stock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        .product-body {
          padding: 14px;
        }

        .product-meta {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #9ca3af;
          font-weight: 700;
        }

        .product-title {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          margin-top: 6px;
        }

        .product-price {
          font-size: 16px;
          font-weight: 800;
          color: #111827;
          margin-top: 6px;
        }

        .product-sub {
          font-size: 11px;
          text-transform: uppercase;
          color: #6b7280;
          margin-top: 6px;
        }

        .product-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 12px;
        }

        .btn-primary {
          background: #111827;
          color: #ffffff;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 700;
        }

        .btn-secondary {
          border: 1px solid #111827;
          color: #111827;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 700;
        }

        .btn-disabled {
          background: #e5e7eb;
          color: #9ca3af;
        }

        .btn-added {
          background: #f3c623;
          color: #111827;
        }

        .product-brand {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c0c4cc;
          margin-top: 10px;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: #ffffff;
          border: 1px solid #ededed;
          border-radius: 16px;
          color: #6b7280;
          font-size: 14px;
        }

        .empty-state span {
          display: block;
          margin-top: 6px;
          font-size: 12px;
        }

        .skeleton-card {
          background: #ffffff;
          border: 1px solid #ededed;
          border-radius: 16px;
          padding: 14px;
        }

        .skeleton-img {
          height: 200px;
          background: #f1f1f1;
          border-radius: 12px;
        }

        .skeleton-line {
          height: 10px;
          background: #f1f1f1;
          border-radius: 8px;
          margin-top: 12px;
        }

        .skeleton-line.short {
          width: 60%;
        }

        @media (min-width: 900px) {
          .shop-layout {
            grid-template-columns: 280px 1fr;
            gap: 32px;
          }
        }

        @media (max-width: 1024px) {
          .filter-panel {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 24px;
          }

          .hero-pill {
            margin-top: 8px;
          }

          .hero-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .toolbar {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .toolbar-right {
            width: 100%;
            justify-content: space-between;
          }

          .filter-card {
            border-radius: 12px;
          }

          .product-media {
            height: 200px;
          }
        }

        @media (max-width: 480px) {
          .product-grid,
          .skeleton-grid {
            grid-template-columns: 1fr;
          }

          .product-actions {
            grid-template-columns: 1fr;
          }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

