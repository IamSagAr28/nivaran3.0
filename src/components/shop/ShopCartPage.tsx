import React, { useState } from 'react'
import { Header } from '../Header'
import { Footer } from '../Footer'
import { useShopCart } from '../../contexts/ShopCartContext'
import { useRouter } from '../../utils/Router'
import { createRazorpayOrder, verifyRazorpayPayment, validateOfferCode } from '../../utils/shopApi'
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ArrowRight, CheckCircle, Truck, ShieldCheck, Package, CreditCard } from 'lucide-react'

type Step = 'cart' | 'checkout' | 'success'

interface OrderForm {
  customer_name: string
  customer_email: string
  customer_phone: string
  address: string
  city: string
  state: string
  pincode: string
  notes: string
}

export default function ShopCartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } = useShopCart()
  const { navigateTo } = useRouter()

  const styleBlock = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

      :root {
        --myntra-bg: #f5f5f6;
        --myntra-text: #111827;
        --myntra-muted: #6b7280;
        --myntra-border: #e5e7eb;
        --myntra-card: #ffffff;
        --myntra-accent: #ff3f6c;
        --myntra-accent-dark: #e7335d;
        --myntra-gold: #f3c623;
        --myntra-green: #2e7d32;
      }

      .shop-cart-page {
        font-family: 'Manrope', sans-serif;
        background: var(--myntra-bg);
        color: var(--myntra-text);
      }

      .cart-shell {
        max-width: 1680px;
        margin: 0 auto;
        padding: 28px 28px 80px;
      }

      .cart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 20px;
      }

      .cart-steps {
        display: flex;
        gap: 10px;
        align-items: center;
        font-size: 11px;
        color: var(--myntra-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .cart-steps span.active {
        color: var(--myntra-text);
        font-weight: 800;
      }

      .cart-title {
        font-size: 22px;
        font-weight: 800;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .cart-subtitle {
        font-size: 12px;
        color: var(--myntra-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .cart-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 460px;
        gap: 24px;
      }

      .cart-items {
        background: var(--myntra-card);
        border: 1px solid var(--myntra-border);
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 12px 28px rgba(17, 24, 39, 0.06);
      }

      .cart-items-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }

      .cart-items-title {
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .cart-items-note {
        font-size: 12px;
        color: var(--myntra-muted);
      }

      .cart-item {
        display: grid;
        grid-template-columns: 92px minmax(0, 1fr) auto;
        gap: 16px;
        padding: 16px;
        border: 1px solid var(--myntra-border);
        border-radius: 14px;
        background: #fff;
      }

      .cart-item + .cart-item {
        margin-top: 12px;
      }

      .cart-img {
        width: 92px;
        height: 110px;
        border-radius: 12px;
        background: #f0f0f0;
        overflow: hidden;
        cursor: pointer;
      }

      .cart-title-link {
        font-size: 14px;
        font-weight: 700;
        color: var(--myntra-text);
      }

      .cart-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 600;
        color: #374151;
        background: #f3f4f6;
        border-radius: 999px;
        padding: 4px 8px;
        margin-top: 6px;
      }

      .cart-meta {
        font-size: 12px;
        color: var(--myntra-muted);
        margin-top: 4px;
      }

      .cart-price {
        font-size: 14px;
        font-weight: 800;
        color: var(--myntra-text);
        margin-top: 8px;
      }

      .cart-qty {
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--myntra-border);
        border-radius: 10px;
        overflow: hidden;
        margin-top: 10px;
      }

      .cart-qty button {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fafafa;
        color: #111827;
      }

      .cart-qty span {
        width: 32px;
        text-align: center;
        font-weight: 700;
        font-size: 12px;
      }

      .cart-remove {
        color: #9ca3af;
      }

      .cart-remove:hover {
        color: var(--myntra-accent);
      }

      .cart-summary {
        background: var(--myntra-card);
        border: 1px solid var(--myntra-border);
        border-radius: 18px;
        padding: 22px;
        height: fit-content;
        position: sticky;
        top: 20px;
        box-shadow: 0 12px 28px rgba(17, 24, 39, 0.08);
      }

      .summary-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }

      .summary-badge {
        background: #fef3c7;
        color: #92400e;
        font-size: 11px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 999px;
      }

      .checkout-shell {
        max-width: 1280px;
        margin: 0 auto;
        padding: 24px 16px 80px;
      }

      .checkout-hero {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        gap: 12px;
      }

      .checkout-hero h1 {
        font-size: 20px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .checkout-hero p {
        font-size: 12px;
        color: var(--myntra-muted);
      }

      .checkout-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 20px;
      }

      .checkout-card {
        background: #fff;
        border: 1px solid var(--myntra-border);
        border-radius: 16px;
        padding: 18px;
        box-shadow: 0 10px 24px rgba(17, 24, 39, 0.04);
      }

      .checkout-field label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #374151;
      }

      .checkout-field input,
      .checkout-field textarea {
        border: 1px solid var(--myntra-border);
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 13px;
        background: #fafafa;
      }

      .checkout-field input:focus,
      .checkout-field textarea:focus {
        outline: none;
        border-color: var(--myntra-accent);
        box-shadow: 0 0 0 3px rgba(255, 63, 108, 0.12);
        background: #fff;
      }

      .checkout-note {
        font-size: 12px;
        color: var(--myntra-muted);
      }

      .checkout-title {
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 10px;
      }
payment-options {
        display: grid;
        gap: 10px;
      }

      .payment-option {
        border: 1px solid var(--myntra-border);
        border-radius: 14px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        background: #fff;
      }

      .payment-option.active {
        border-color: var(--myntra-accent);
        box-shadow: 0 0 0 3px rgba(255, 63, 108, 0.12);
      }

      .payment-option-title {
        font-size: 13px;
        font-weight: 700;
      }

      .payment-option-desc {
        font-size: 12px;
        color: var(--myntra-muted);
      }

      .offer-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .offer-input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid var(--myntra-border);
        border-radius: 10px;
        font-size: 14px;
        background: #fff;
      }

      .offer-apply {
        padding: 10px 14px;
        border-radius: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        background: var(--myntra-accent);
        color: #fff;
        border: none;
        cursor: pointer;
        white-space: nowrap;
      }

      .offer-apply:hover {
        background: var(--myntra-accent-dark);
      }

      .offer-apply:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: var(--myntra-muted);
      }

      .summary-total {
        display: flex;
        justify-content: space-between;
        font-size: 16px;
        font-weight: 800;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed var(--myntra-border);
      }

      .summary-cta {
        width: 100%;
        border-radius: 10px;
        padding: 12px 14px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        background: var(--myntra-accent);
        color: white;
      }

      .summary-cta:hover {
        background: var(--myntra-accent-dark);
      }

      .summary-secondary {
        width: 100%;
        border-radius: 10px;
        padding: 10px 14px;
        font-weight: 700;
        border: 1px solid var(--myntra-border);
        background: #fff;
        color: #374151;
      }

      .empty-card {
        background: #fff;
        border: 1px solid var(--myntra-border);
        border-radius: 16px;
        padding: 40px 24px;
        text-align: center;
      }

      .success-card {
        background: #fff;
        border: 1px solid var(--myntra-border);
        border-radius: 18px;
        padding: 28px;
        box-shadow: 0 12px 28px rgba(17, 24, 39, 0.08);
      }

      .success-shell {
        max-width: 1100px;
        margin: 0 auto;
        padding: 32px 16px 80px;
        width: 100%;
      }

      .success-hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 24px;
        align-items: center;
      }

      .success-banner {
        border-radius: 18px;
        padding: 24px;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 40%, #fff2f6 100%);
        border: 1px solid #f1f5f9;
      }

      .success-title {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 0.02em;
      }

      .success-subtitle {
        color: var(--myntra-muted);
        margin-top: 6px;
        font-size: 14px;
      }

      .success-details {
        margin-top: 18px;
        display: grid;
        gap: 10px;
      }

      .success-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: #111827;
        background: #ffffff;
        border: 1px solid var(--myntra-border);
        border-radius: 12px;
        padding: 10px 12px;
      }

      .success-actions {
        display: grid;
        gap: 10px;
        margin-top: 16px;
      }

      .success-help {
        font-size: 12px;
        color: var(--myntra-muted);
        text-align: center;
      }

      @media (max-width: 1024px) {
        .cart-grid {
          grid-template-columns: 1fr;
        }
        .cart-summary {
          position: static;
        }
        .cart-shell {
          padding: 20px 16px 64px;
        }
        .checkout-grid {
          grid-template-columns: 1fr;
        }
        .success-hero {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .cart-item {
          grid-template-columns: 80px minmax(0, 1fr);
        }
        .cart-actions {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }
        .cart-title {
          font-size: 18px;
        }
      }
    `}</style>
  )

  const [step, setStep] = useState<Step>('cart')
  const [form, setForm] = useState<OrderForm>({
    customer_name: '', customer_email: '', customer_phone: '',
    address: '', city: '', state: '', pincode: '', notes: ''
  })
  const [errors, setErrors] = useState<Partial<OrderForm>>({})
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [apiError, setApiError] = useState('')

  const [offerCode, setOfferCode] = useState('')
  const [offerApplied, setOfferApplied] = useState<{ code: string; percent: number } | null>(null)
  const [offerApplying, setOfferApplying] = useState(false)
  const [offerMessage, setOfferMessage] = useState('')

  const shipping = subtotal >= 999 ? 0 : 150
  const discountAmount = offerApplied?.percent
    ? Number(((subtotal * offerApplied.percent) / 100).toFixed(2))
    : 0
  const total = subtotal + shipping
  const payableTotal = Number((subtotal - discountAmount + shipping).toFixed(2))

  const applyOffer = async () => {
    const code = offerCode.trim()
    if (!code) {
      setOfferApplied(null)
      setOfferMessage('')
      return
    }

    try {
      setOfferApplying(true)
      setOfferMessage('')

      const result = await validateOfferCode(code)
      if (result?.valid && Number(result?.percent) > 0) {
        setOfferApplied({ code, percent: Number(result.percent) })
        setOfferMessage('Offer applied.')
      } else {
        setOfferApplied(null)
        setOfferMessage('Invalid offer code.')
      }
    } catch (e: any) {
      setOfferApplied(null)
      setOfferMessage(e?.message || 'Failed to apply offer code.')
    } finally {
      setOfferApplying(false)
    }
  }

  const validate = () => {
    const errs: Partial<OrderForm> = {}
    if (!form.customer_name.trim()) errs.customer_name = 'Name is required'
    if (!form.customer_email.trim() || !/\S+@\S+\.\S+/.test(form.customer_email)) errs.customer_email = 'Valid email required'
    if (!form.customer_phone.trim() || !/^\d{10}$/.test(form.customer_phone)) errs.customer_phone = '10-digit phone required'
    if (!form.address.trim()) errs.address = 'Address is required'
    if (!form.city.trim()) errs.city = 'City is required'
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) errs.pincode = '6-digit pincode required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePlaceOrder = async () => {
    if (!validate()) {
      setApiError('Please fill all required fields correctly.')
      return
    }
    setPlacing(true)
    setApiError('')
    
    // Prepare order payload
    const orderPayload = {
      ...form,
      items: items.map(i => ({ 
        id: i.id, 
        title: i.title, 
        price: i.price, 
        quantity: i.quantity, 
        image: i.image,
        category: i.category,
        material: i.material
      })),
      subtotal, shipping, total: payableTotal,
      paymentMethod: 'ONLINE',
      offerCode: offerApplied?.code || undefined,
      discountAmount: discountAmount || undefined,
    }

    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you online?')
      }

      // 1. Create order on backend (which creates RP order)
      const rpOrderResult = await createRazorpayOrder(payableTotal, `rcpt_${Date.now()}`)

      // 2. Open Razorpay Checkout modal
      const options = {
        key: rpOrderResult.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rpOrderResult.amount,
        currency: rpOrderResult.currency,
        name: "Nivaran Upcyclers",
        description: "Eco-Friendly Products",
        order_id: rpOrderResult.orderId,
        handler: async function (response: any) {
          try {
            setPlacing(true)
            // 3. Verify Payment on Backend
            const verifyResult = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: orderPayload
            })

            setOrderId(verifyResult.orderId)
            clearCart()
            setStep('success')
          } catch (err: any) {
            setApiError(err.message || 'Payment verification failed.')
          } finally {
            setPlacing(false)
          }
        },
        modal: {
          ondismiss: function() {
            setPlacing(false)
          }
        },
        prefill: {
          name: form.customer_name,
          email: form.customer_email,
          contact: form.customer_phone
        },
        theme: {
          color: "#ff3f6c" // Myntra-like accent
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        setApiError(response.error.description || 'Payment Failed')
        setPlacing(false)
      })
      rzp.open()
    } catch (err: any) {
      setApiError(err.message || 'Failed to place order. Please try again.')
      setPlacing(false)
    }
  }

  const handleField = (field: keyof OrderForm, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  // ====== SUCCESS VIEW ======
  if (step === 'success') return (
    <div className="shop-cart-page flex flex-col min-h-screen">
      {styleBlock}
      <Header showCategories={false} />
      <div className="success-shell">
        <div className="success-hero">
          <div className="success-banner">
            <div className="w-16 h-16 bg-[#ecfdf3] rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-[#16a34a]" />
            </div>
            <h1 className="success-title">Order confirmed</h1>
            <p className="success-subtitle">Order #{orderId} is placed. We will notify you as it moves.</p>
            <div className="success-details">
              <div className="success-row"><Truck className="w-4 h-4" /> Estimated delivery: 3-7 business days</div>
              <div className="success-row"><ShieldCheck className="w-4 h-4" /> Confirmation sent to {form.customer_email}</div>
              <div className="success-row"><Package className="w-4 h-4" /> Order ID: #{orderId}</div>
            </div>
            <div className="success-actions">
              <button onClick={() => navigateTo('/shop')} className="summary-cta">Continue Shopping</button>
              <button onClick={() => navigateTo('/shop-cart')} className="summary-secondary">View Cart</button>
            </div>
          </div>

          <div className="success-card">
            <h2 className="text-lg font-bold text-[#111827] mb-2">What happens next?</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="success-row"><CheckCircle className="w-4 h-4" /> We confirm your order within 24 hours.</div>
              <div className="success-row"><Package className="w-4 h-4" /> Your order is packed with care.</div>
              <div className="success-row"><Truck className="w-4 h-4" /> Shipment updates arrive via SMS/email.</div>
            </div>
            <p className="success-help mt-4">Need help? Email us at info@nivaranupcyclers.in</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )

  // ====== CHECKOUT FORM ======
  if (step === 'checkout') return (
    <div className="shop-cart-page flex flex-col min-h-screen">
      {styleBlock}
      <Header showCategories={false} />
      <main className="flex-1 checkout-shell">
        <div className="checkout-hero">
          <div>
            <h1>Checkout</h1>
            <p>Complete your details to place the order.</p>
          </div>
          <div className="cart-steps">
            <span>Bag</span>
            <span>&gt;</span>
            <span className="active">Address</span>
            <span>&gt;</span>
            <span>Payment</span>
          </div>
        </div>
        <button onClick={() => setStep('cart')} className="flex items-center gap-2 text-[#1f2937] hover:underline mb-6 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </button>
        <div className="checkout-grid">
          {/* Form */}
          <div className="space-y-6">
            <div className="checkout-card">
              <div className="checkout-title">Shipping Details</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { field: 'customer_name' as const, label: 'Full Name', placeholder: 'Your name', type: 'text', full: true },
                  { field: 'customer_email' as const, label: 'Email', placeholder: 'you@email.com', type: 'email', full: false },
                  { field: 'customer_phone' as const, label: 'Phone', placeholder: '10-digit number', type: 'tel', full: false },
                  { field: 'address' as const, label: 'Address', placeholder: 'Street address, Flat No.', type: 'text', full: true },
                  { field: 'city' as const, label: 'City', placeholder: 'City', type: 'text', full: false },
                  { field: 'state' as const, label: 'State', placeholder: 'State', type: 'text', full: false },
                  { field: 'pincode' as const, label: 'Pincode', placeholder: '6-digit pincode', type: 'text', full: false },
                ] as { field: keyof OrderForm; label: string; placeholder: string; type: string; full: boolean }[]).map(({ field, label, placeholder, type, full }) => (
                  <div key={field} className={`checkout-field ${full ? 'sm:col-span-2' : ''}`}>
                    <label className="block mb-1">{label}</label>
                    <input
                      type={type}
                      value={form[field]}
                      onChange={e => handleField(field, e.target.value)}
                      placeholder={placeholder}
                    />
                    {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="checkout-field block mb-1">Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={e => handleField('notes', e.target.value)}
                    placeholder="Special instructions for delivery..."
                    rows={2}
                    className="checkout-field"
                  />
                </div>
              </div>
            </div>
            <div className="checkout-card">
              <h3 className="checkout-title flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#48634A]" /> Payment Method
              </h3>
              <div className="payment-options mt-4">
                <div 
                  className="payment-option active"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center p-[2px]">
                      <div className="w-full h-full bg-[#ff3f6c] rounded-full" />
                    </div>
                    <div>
                      <p className="payment-option-title text-black">Pay Online (UPI, Cards, Wallets)</p>
                      <p className="payment-option-desc">Fast and secure payments via Razorpay</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-[#ff3f6c]" />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing}
              className="summary-cta flex items-center justify-center gap-2"
            >
              {placing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {placing ? 'Processing...' : 'Pay Now'}
            </button>
            {apiError && <p className="text-xs text-red-500 mt-3 text-center">{apiError}</p>}
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="cart-summary">
              <div className="summary-head">
                <h3 className="font-bold text-[#111827]">Order Summary</h3>
                <span className="summary-badge">Secure</span>
              </div>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f0ece5] shrink-0">
                      {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-lg">🌿</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#344e41] line-clamp-1">{item.title}</p>
                      <p className="text-xs text-gray-500">×{item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold text-[#48634A]">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#e0ddd5] pt-4 space-y-2">
                <div className="offer-row">
                  <input
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value)}
                    placeholder="Offer code"
                    className="offer-input"
                    disabled={offerApplying || placing}
                  />
                  <button
                    type="button"
                    onClick={applyOffer}
                    disabled={offerApplying || placing}
                    className="offer-apply"
                  >
                    {offerApplying ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {offerMessage && (
                  <p className={`text-xs ${offerApplied ? 'text-green-600' : 'text-red-500'}`}>
                    {offerMessage}
                  </p>
                )}

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Discount{offerApplied?.code ? ` (${offerApplied.code})` : ''}</span>
                    <span className="text-green-600 font-medium">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {shipping === 0 && <p className="text-xs text-green-600">🎉 Free shipping on orders above ₹999!</p>}
                <div className="border-t border-[#e0ddd5] pt-2 flex justify-between font-bold text-[#344e41]">
                  <span>Total</span>
                  <span>₹{payableTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )

  // ====== CART VIEW ======
  return (
    <div className="shop-cart-page flex flex-col min-h-screen">
      {styleBlock}
      <Header showCategories={false} />
      <main className="flex-1 cart-shell">
        <div className="cart-header">
          <div>
            <div className="cart-subtitle">NIVARAN UPCYCLERS</div>
            <h1 className="cart-title">Shopping Bag</h1>
          </div>
          <div className="cart-steps">
            <span className="active">Bag</span>
            <span>&gt;</span>
            <span>Address</span>
            <span>&gt;</span>
            <span>Payment</span>
          </div>
          <button onClick={() => navigateTo('/products')} className="text-sm font-semibold text-[#1f2937] hover:underline">
            Continue Shopping
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-card">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-lg font-semibold text-[#111827] mb-2">Your bag is empty</h2>
            <p className="text-sm text-gray-500 mb-6">Add items to see them here.</p>
            <button onClick={() => navigateTo('/products')} className="summary-cta">
              Shop Now
            </button>
          </div>
        ) : (
          <div className="cart-grid">
            {/* Items */}
            <div className="cart-items">
              <div className="cart-items-header">
                <div className="cart-items-title">Items ({totalItems})</div>
                <div className="cart-items-note">Free shipping above ₹999</div>
              </div>
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <div
                    className="cart-img"
                    onClick={() => navigateTo(`/product/${item.id}`)}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🌿</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="cart-title-link cursor-pointer hover:underline"
                      onClick={() => navigateTo(`/product/${item.id}`)}
                    >
                      {item.title}
                    </h3>
                    {item.material && <p className="cart-meta">{item.material}</p>}
                    <div className="cart-chip">Easy returns</div>
                    <p className="cart-price">₹{(item.price * item.quantity).toFixed(2)}</p>
                    <div className="cart-actions">
                      <div className="cart-qty">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-[#48634A] hover:bg-[#f0ece5] transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-[#344e41]">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-[#48634A] hover:bg-[#f0ece5] transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="cart-remove transition-colors p-1" aria-label="Remove item">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="cart-summary">
              <h2 className="font-bold text-[#111827] text-lg mb-4">Price Details</h2>
              <div className="space-y-3 mb-6">
                <div className="summary-row">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-400">Add ₹{(999 - subtotal).toFixed(2)} more for free shipping!</p>
                )}
                {shipping === 0 && <p className="text-xs text-green-600">🎉 You qualify for free shipping!</p>}
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setStep('checkout')}
                className="summary-cta flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={clearCart} className="summary-secondary mt-3">
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
