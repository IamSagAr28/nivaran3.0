import React, { useState, useEffect } from 'react'
import {
  fetchAdminStats, fetchAdminProducts, createProduct, updateProduct, deleteProduct,
  fetchAdminOrders, updateOrderStatus, deleteOrder, adminLogout, changeAdminPassword,
  createShiprocketShipment
} from '../../utils/shopApi'
import {
  LayoutDashboard, Package, ShoppingBag, LogOut, Plus, Pencil, Trash2,
  RefreshCw, ChevronDown, X, Save, AlertTriangle, TrendingUp, Clock,
  CheckCircle, Truck, XCircle, Key, ImagePlus, Search, Eye, BarChart3, Leaf
} from 'lucide-react'

// ---- Types ----
interface Product {
  id: number; title: string; description: string; price: number
  compare_at_price?: number; images: string[]; category: string
  colors: string[]; material: string; stock: number; featured: number
}
interface Order {
  id: number; customer_name: string; customer_email: string; customer_phone: string
  address: string; city: string; state: string; pincode: string; items: any[]
  subtotal: number; shipping: number; total: number; status: string
  notes: string; created_at: string
  shiprocket_order_id?: string; shiprocket_shipment_id?: string
  shiprocket_awb_code?: string; shiprocket_courier_name?: string
  shiprocket_tracking_url?: string; shiprocket_status?: string
}
interface Stats { products: number; orders: number; pending: number; revenue: number }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  pending: { label: 'Pending', color: 'amber', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'blue', icon: CheckCircle },
  processing: { label: 'Processing', color: 'purple', icon: RefreshCw },
  shipped: { label: 'Shipped', color: 'indigo', icon: Truck },
  delivered: { label: 'Delivered', color: 'green', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'red', icon: XCircle },
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700', shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600',
}

interface Props { username: string; onLogout: () => void }

export default function AdminDashboard({ username, onLogout }: Props) {
  const [section, setSection] = useState<'dashboard' | 'products' | 'orders' | 'settings'>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [savingProduct, setSavingProduct] = useState(false)
  const [productError, setProductError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'product' | 'order'; id: number } | null>(null)
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [passwordMsg, setPasswordMsg] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load stats
  const loadStats = () => {
    setLoadingStats(true)
    fetchAdminStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoadingStats(false))
  }

  const loadProducts = () => {
    setLoadingProducts(true)
    fetchAdminProducts()
      .then((d: { products?: Product[] }) => setProducts(d.products || []))
      .catch(console.error)
      .finally(() => setLoadingProducts(false))
  }

  const loadOrders = () => {
    setLoadingOrders(true)
    fetchAdminOrders(orderStatusFilter || undefined)
      .then((d: { orders?: Order[] }) => setOrders(d.orders || []))
      .catch(console.error)
      .finally(() => setLoadingOrders(false))
  }

  useEffect(() => { loadStats() }, [])
  useEffect(() => { if (section === 'products') loadProducts() }, [section])
  useEffect(() => { if (section === 'orders') loadOrders() }, [section, orderStatusFilter])

  // Product form
  const emptyProduct = (): Partial<Product> => ({
    title: '', description: '', price: 0, compare_at_price: undefined,
    images: [], category: '', colors: [], material: '', stock: 0, featured: 0
  })

  const openProductModal = (p?: Product) => {
    setEditingProduct(p ? { ...p } : emptyProduct())
    setProductError('')
    setProductModalOpen(true)
  }

  const saveProduct = async () => {
    if (!editingProduct?.title || !editingProduct?.price) {
      setProductError('Title and price are required'); return
    }
    setSavingProduct(true)
    setProductError('')
    try {
      if (editingProduct.id) {
        await updateProduct(editingProduct.id, editingProduct)
      } else {
        await createProduct(editingProduct)
      }
      setProductModalOpen(false)
      loadProducts()
      loadStats()
    } catch (e: any) {
      setProductError(e.message || 'Failed to save product')
    } finally {
      setSavingProduct(false)
    }
  }

  const handleDeleteProduct = async (id: number) => {
    await deleteProduct(id)
    setProducts(p => p.filter(x => x.id !== id))
    setConfirmDelete(null)
    loadStats()
  }

  const handleDeleteOrder = async (id: number) => {
    await deleteOrder(id)
    setOrders(o => o.filter(x => x.id !== id))
    setConfirmDelete(null)
    loadStats()
  }

  const handleCreateShipment = async (orderId: number) => {
    try {
      await createShiprocketShipment(orderId)
      await loadOrders()
    } catch (e: any) {
      alert(e.message || 'Failed to create shipment')
    }
  }

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus)
    setOrders(o => o.map(x => x.id === orderId ? { ...x, status: newStatus } : x))
    loadStats()
  }

  const handleLogout = async () => {
    await adminLogout()
    onLogout()
  }

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.newPass) { setPasswordMsg('All fields required'); return }
    if (passwordForm.newPass !== passwordForm.confirm) { setPasswordMsg('Passwords do not match'); return }
    if (passwordForm.newPass.length < 8) { setPasswordMsg('Password must be at least 8 characters'); return }
    try {
      await changeAdminPassword(passwordForm.current, passwordForm.newPass)
      setPasswordMsg('✅ Password changed successfully!')
      setPasswordForm({ current: '', newPass: '', confirm: '' })
    } catch (e: any) {
      setPasswordMsg('❌ ' + (e.message || 'Failed'))
    }
  }

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  )

  const filteredOrders = orders.filter(o =>
    o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.customer_email.toLowerCase().includes(orderSearch.toLowerCase()) ||
    String(o.id).includes(orderSearch)
  )

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'settings', label: 'Settings', icon: Key },
  ]

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans overflow-hidden text-[#1a1a1a]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-[#121212] flex flex-col transition-all duration-300 ease-in-out shrink-0 relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
        {/* Logo */}
        <div className="flex items-center gap-4 px-6 py-8 border-b border-white/5">
          <div className="w-10 h-10 bg-gradient-to-br from-[#A8C5A0] to-[#7b9c73] rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="whitespace-nowrap transition-opacity duration-300">
              <p className="text-white font-bold text-lg tracking-tight">Nivara Admin</p>
              <p className="text-[#A8C5A0] text-xs font-medium opacity-80">{username}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key as any)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 text-left ${section === key ? 'bg-gradient-to-r from-[#A8C5A0]/20 to-transparent text-[#A8C5A0] border-l-4 border-[#A8C5A0]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'}`}
              title={!sidebarOpen ? label : ''}
            >
              <Icon className={`${section === key ? 'text-[#A8C5A0]' : ''} w-5 h-5 shrink-0 transition-colors`} />
              {sidebarOpen && <span className="text-sm font-semibold tracking-wide whitespace-nowrap">{label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-red-500/10 hover:border-red-500 border-l-4 border-transparent transition-all"
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
        
        {/* Topbar */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-5 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(s => !s)} className="text-gray-400 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight capitalize">{section}</h1>
          </div>
          <div className="flex items-center gap-4">
            {section === 'products' && (
              <button
                id="add-product-btn"
                onClick={() => openProductModal()}
                className="flex items-center gap-2 bg-[#121212] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            )}
            <div className="w-10 h-10 bg-gradient-to-br from-[#f0f0f0] to-[#e0e0e0] border border-white shadow-inner rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-gray-700">{username[0]?.toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Section Content */}
        <main className="flex-1 overflow-y-auto p-8 z-0">

          {/* ===== DASHBOARD ===== */}
          {section === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: 'Total Products', value: stats?.products, icon: Package, color: 'from-green-400 to-emerald-500' },
                  { label: 'Total Orders', value: stats?.orders, icon: ShoppingBag, color: 'from-blue-400 to-blue-500' },
                  { label: 'Pending Orders', value: stats?.pending, icon: Clock, color: 'from-amber-400 to-orange-500' },
                  { label: 'Revenue', value: stats ? `₹${stats.revenue.toFixed(0)}` : '—', icon: TrendingUp, color: 'from-purple-400 to-purple-600' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-50 to-transparent opacity-50 rounded-bl-full pointer-events-none" />
                    <div>
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 shadow-inner`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-3xl font-black text-gray-800">
                        {loadingStats ? <span className="inline-block w-16 h-8 bg-gray-100 animate-pulse rounded-lg" /> : value ?? 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg mb-5">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => { setSection('products'); setTimeout(() => openProductModal(), 200) }} className="flex items-center gap-2 bg-[#121212] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                  <button onClick={() => setSection('orders')} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all hover:border-gray-300">
                    <ShoppingBag className="w-4 h-4" /> View Orders
                  </button>
                  <button onClick={() => { loadStats(); const s = section as string; if (s === 'products') loadProducts(); if (s === 'orders') loadOrders() }} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-500 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all hover:border-gray-300">
                    <RefreshCw className="w-4 h-4" /> Refresh Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== PRODUCTS ===== */}
          {section === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search products by title or category..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border-none bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C5A0] font-medium placeholder-gray-400 transition-shadow"
                  />
                </div>
                <button onClick={loadProducts} className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loadingProducts ? (
                <div className="flex justify-center py-24">
                  <div className="w-12 h-12 border-4 border-[#121212] border-t-transparent rounded-full animate-[spin_0.8s_linear_infinite]" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Package className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-800 font-bold text-xl mb-2">No products found</p>
                  <p className="text-gray-400 font-medium mb-8">Start by adding your first product to the store inventory.</p>
                  <button onClick={() => openProductModal()} className="inline-flex items-center gap-2 bg-[#121212] text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                    <Plus className="w-5 h-5" /> Add Your First Product
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto min-h-[50vh]">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest w-2/5">Product Details</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Category</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Price</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Inventory</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredProducts.map((p, i) => (
                          <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-[1.25rem] overflow-hidden bg-gray-100 shrink-0 shadow-sm border border-black/5 relative group-hover:shadow-md transition-all">
                                  {p.images?.[0] ? (
                                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover transform duration-500 group-hover:scale-110" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-xs uppercase tracking-widest">No Img</div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800 text-base leading-tight mb-1">{p.title}</p>
                                  <p className="text-xs text-gray-500 font-medium">{p.material || 'Standard Material'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-block px-4 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider">{p.category || 'Uncategorized'}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="font-bold text-gray-800 text-base">₹{p.price.toFixed(2)}</p>
                              {p.compare_at_price && p.compare_at_price > p.price && <p className="text-xs text-gray-400 line-through font-medium mt-0.5">₹{p.compare_at_price.toFixed(2)}</p>}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end">
                                <span className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${p.stock > 10 ? 'bg-green-50 text-green-700 border-green-200' : p.stock > 0 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                  <span className={`w-2 h-2 rounded-full ${p.stock > 10 ? 'bg-green-500' : p.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
                                  {p.stock > 0 ? `${p.stock} Units` : 'Out of Stock'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openProductModal(p)} className="p-2.5 bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-xl transition-all shadow-sm" title="Edit">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => setConfirmDelete({ type: 'product', id: p.id })} className="p-2.5 bg-white border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all shadow-sm" title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== ORDERS ===== */}
          {section === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    placeholder="Search orders..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#c9d7c3] text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A] bg-white"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="border border-[#c9d7c3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A] bg-white"
                >
                  <option value="">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <button onClick={loadOrders} className="p-2 rounded-xl border border-[#c9d7c3] text-gray-500 hover:text-[#48634A] hover:border-[#48634A] transition-colors bg-white">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loadingOrders ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-[#48634A] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#e8e4dc]">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-[#344e41]">Order #{order.id}</p>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                              {STATUS_CONFIG[order.status]?.label || order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium">{order.customer_name}</p>
                          <p className="text-xs text-gray-500">{order.customer_email} · {order.customer_phone}</p>
                          <p className="text-xs text-gray-500 mt-1">{order.address}, {order.city} {order.pincode}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#48634A]">₹{order.total?.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{Array.isArray(order.items) ? order.items.length : 0} item(s)</p>
                        </div>
                      </div>

                      {/* Items mini */}
                      {Array.isArray(order.items) && order.items.length > 0 && (
                        <div className="mt-3 border-t border-[#f0ece5] pt-3 flex flex-wrap gap-2">
                          {order.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 bg-[#f8f6f1] rounded-lg px-3 py-1.5">
                              {item.image && <img src={item.image} alt={item.title} className="w-6 h-6 rounded object-cover" />}
                              <span className="text-xs text-[#344e41] font-medium">{item.title}</span>
                              <span className="text-xs text-gray-500">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-3 flex-wrap">
                        <select
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          className="border border-[#c9d7c3] rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A] bg-white"
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                        <button onClick={() => setViewingOrder(order)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium">
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                        {!order.shiprocket_shipment_id ? (
                          <button onClick={() => handleCreateShipment(order.id)} className="flex items-center gap-1 text-xs text-[#48634A] hover:text-[#344e41] transition-colors font-medium">
                            <Truck className="w-3.5 h-3.5" /> Create Shipment
                          </button>
                        ) : (
                          <span className="text-xs text-green-600 font-semibold">Shipment Created</span>
                        )}
                        <button onClick={() => setConfirmDelete({ type: 'order', id: order.id })} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium ml-auto">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {section === 'settings' && (
            <div className="max-w-md">
              <div className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm p-6">
                <h3 className="font-bold text-[#344e41] mb-5 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Change Password
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'current', label: 'Current Password', placeholder: 'Current password' },
                    { key: 'newPass', label: 'New Password', placeholder: 'Min. 8 characters' },
                    { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-[#344e41] mb-1">{label}</label>
                      <input
                        type="password"
                        value={passwordForm[key as keyof typeof passwordForm]}
                        onChange={e => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full border border-[#c9d7c3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A]"
                      />
                    </div>
                  ))}
                  {passwordMsg && <p className={`text-sm ${passwordMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{passwordMsg}</p>}
                  <button onClick={handleChangePassword} className="w-full py-2.5 bg-[#48634A] text-white rounded-xl font-semibold text-sm hover:bg-[#344e41] transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===== PRODUCT MODAL ===== */}
      {productModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-[#e0ddd5]">
              <h2 className="text-lg font-bold text-[#344e41]">
                {editingProduct.id ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setProductModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344e41] mb-1">Product Title *</label>
                  <input
                    value={editingProduct.title || ''}
                    onChange={e => setEditingProduct(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Handmade Jute Rug"
                    className="w-full border border-[#c9d7c3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A]"
                  />
                </div>
                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344e41] mb-1">Description</label>
                  <textarea
                    value={editingProduct.description || ''}
                    onChange={e => setEditingProduct(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the product..."
                    rows={3}
                    className="w-full border border-[#c9d7c3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A] resize-none"
                  />
                </div>
                {/* Price & Compare */}
                <div>
                  <label className="block text-xs font-semibold text-[#344e41] mb-1">Price (₹) *</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={editingProduct.price || ''}
                    onChange={e => setEditingProduct(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full border border-[#c9d7c3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#344e41] mb-1">Compare-at Price (₹)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={editingProduct.compare_at_price || ''}
                    onChange={e => setEditingProduct(p => ({ ...p, compare_at_price: parseFloat(e.target.value) || undefined }))}
                    placeholder="Original price (shows strikethrough)"
                    className="w-full border border-[#c9d7c3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A]"
                  />
                </div>
                {/* Category & Material */}
                <div>
                  <label className="block text-xs font-semibold text-[#344e41] mb-1">Category</label>
                  <input
                    value={editingProduct.category || ''}
                    onChange={e => setEditingProduct(p => ({ ...p, category: e.target.value }))}
                    placeholder="e.g. Bags, Home, Kitchen"
                    className="w-full border border-[#c9d7c3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#344e41] mb-1">Material</label>
                  <input
                    value={editingProduct.material || ''}
                    onChange={e => setEditingProduct(p => ({ ...p, material: e.target.value }))}
                    placeholder="e.g. Organic Cotton, Bamboo"
                    className="w-full border border-[#c9d7c3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A]"
                  />
                </div>
                {/* Stock & Featured */}
                <div>
                  <label className="block text-xs font-semibold text-[#344e41] mb-1">Stock Quantity</label>
                  <input
                    type="number" min="0"
                    value={editingProduct.stock ?? 0}
                    onChange={e => setEditingProduct(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-[#c9d7c3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A]"
                  />
                </div>
                <div className="flex items-center gap-3 self-end pb-2.5">
                  <input
                    type="checkbox"
                    id="featured-check"
                    checked={!!editingProduct.featured}
                    onChange={e => setEditingProduct(p => ({ ...p, featured: e.target.checked ? 1 : 0 }))}
                    className="w-4 h-4 accent-[#48634A]"
                  />
                  <label htmlFor="featured-check" className="text-sm text-[#344e41] font-medium">Featured Product</label>
                </div>
                {/* Colors */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344e41] mb-1">Colors (comma-separated)</label>
                  <input
                    value={(editingProduct.colors || []).join(', ')}
                    onChange={e => setEditingProduct(p => ({ ...p, colors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="e.g. Natural, Green, Brown"
                    className="w-full border border-[#c9d7c3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A]"
                  />
                </div>
                {/* Images */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344e41] mb-1">
                    <span className="flex items-center gap-1"><ImagePlus className="w-3.5 h-3.5" /> Image URLs (one per line)</span>
                  </label>
                  <textarea
                    value={(editingProduct.images || []).join('\n')}
                    onChange={e => setEditingProduct(p => ({ ...p, images: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    rows={3}
                    className="w-full border border-[#c9d7c3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A] resize-none font-mono"
                  />
                  {editingProduct.images && editingProduct.images.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {editingProduct.images.map((img, i) => (
                        <div key={i} className="w-14 h-14 rounded-lg overflow-hidden bg-[#f0ece5] border border-[#c9d7c3]">
                          <img src={img} alt={`img-${i}`} className="w-full h-full object-cover" onError={e => ((e.target as any).style.display = 'none')} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {productError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {productError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#e0ddd5]">
              <button onClick={() => setProductModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-[#c9d7c3] text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={saveProduct}
                disabled={savingProduct}
                className="px-6 py-2.5 bg-[#48634A] text-white rounded-xl text-sm font-semibold hover:bg-[#344e41] transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {savingProduct ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {savingProduct ? 'Saving...' : (editingProduct.id ? 'Save Changes' : 'Create Product')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ORDER DETAIL MODAL ===== */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingOrder(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#e0ddd5]">
              <h2 className="text-lg font-bold text-[#344e41]">Order #{viewingOrder.id}</h2>
              <button onClick={() => setViewingOrder(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-500 font-medium uppercase">Customer</p><p className="font-semibold text-[#344e41]">{viewingOrder.customer_name}</p></div>
                <div><p className="text-xs text-gray-500 font-medium uppercase">Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[viewingOrder.status]}`}>{STATUS_CONFIG[viewingOrder.status]?.label || viewingOrder.status}</span>
                </div>
                <div><p className="text-xs text-gray-500 font-medium uppercase">Email</p><p>{viewingOrder.customer_email}</p></div>
                <div><p className="text-xs text-gray-500 font-medium uppercase">Phone</p><p>{viewingOrder.customer_phone || '—'}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-500 font-medium uppercase">Address</p><p>{viewingOrder.address}, {viewingOrder.city} {viewingOrder.pincode}, {viewingOrder.state}</p></div>
                {viewingOrder.shiprocket_shipment_id && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 font-medium uppercase">Shiprocket</p>
                    <p className="text-sm text-gray-700">Shipment ID: {viewingOrder.shiprocket_shipment_id}</p>
                    {viewingOrder.shiprocket_awb_code && <p className="text-sm text-gray-700">AWB: {viewingOrder.shiprocket_awb_code}</p>}
                    {viewingOrder.shiprocket_courier_name && <p className="text-sm text-gray-700">Courier: {viewingOrder.shiprocket_courier_name}</p>}
                    {viewingOrder.shiprocket_tracking_url && (
                      <p className="text-sm text-blue-600">
                        <a href={viewingOrder.shiprocket_tracking_url} target="_blank" rel="noreferrer">Tracking Link</a>
                      </p>
                    )}
                    {viewingOrder.shiprocket_status && <p className="text-sm text-gray-600">Status: {viewingOrder.shiprocket_status}</p>}
                  </div>
                )}
                {viewingOrder.notes && <div className="col-span-2"><p className="text-xs text-gray-500 font-medium uppercase">Notes</p><p className="text-gray-700 italic">{viewingOrder.notes}</p></div>}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-2">Items</p>
                <div className="space-y-2">
                  {(Array.isArray(viewingOrder.items) ? viewingOrder.items : []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-[#f8f6f1] rounded-xl px-3 py-2">
                      {item.image && <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#344e41] line-clamp-1">{item.title}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} · ₹{item.price?.toFixed(2)}</p>
                      </div>
                      <p className="text-sm font-bold text-[#48634A]">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#e0ddd5] pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{viewingOrder.subtotal?.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{viewingOrder.shipping === 0 ? 'FREE' : `₹${viewingOrder.shipping?.toFixed(2)}`}</span></div>
                <div className="flex justify-between font-bold text-[#344e41] text-base border-t pt-2"><span>Total</span><span>₹{viewingOrder.total?.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[#344e41] mb-2">Confirm Delete</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete this {confirmDelete.type}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => confirmDelete.type === 'product' ? handleDeleteProduct(confirmDelete.id) : handleDeleteOrder(confirmDelete.id)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
