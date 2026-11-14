import React, { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useRouter } from '../utils/Router';
import { usePageSeo } from '../utils/usePageSeo';

export function ShippingPage() {
  const { navigateTo } = useRouter();

  usePageSeo('/shipping-policy', {
    title: 'Shipping & Returns Policy | Nivaran Upcyclers',
    description: 'Shipping & Delivery Policy for Nivaran Upcyclers orders across India. Safe, plastic-free delivery.',
    canonical: 'https://www.nivaranupcyclers.com/shipping-policy'
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const stats = [
    { icon: '🚚', label: 'Free Shipping', sub: 'On orders above ₹999' },
    { icon: '⏱️', label: '2-3 Business Days', sub: 'Dispatch from Kanpur' },
    { icon: '📦', label: '100% Eco-Packed', sub: 'Plastic-free wrapping' },
    { icon: '🔄', label: '7-Day Returns', sub: 'Hassle-free exchange' },
  ];

  const deliveryRows = [
    { zone: 'Metro Cities', cities: 'Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata', time: '3–5 business days' },
    { zone: 'Tier-2 Cities', cities: 'Lucknow, Jaipur, Pune, Ahmedabad, Surat, Nagpur', time: '4–6 business days' },
    { zone: 'Regional Towns', cities: 'Kanpur, Varanasi, Allahabad, Agra, Meerut & others', time: '4–7 business days' },
    { zone: 'Remote Areas', cities: 'North-east states, hill stations, island territories', time: '7–12 business days' },
  ];

  return (
    <div className="sp-root">
      <Header showCategories={false} />

      {/* Hero */}
      <div className="sp-hero">
        <div className="sp-hero-inner">
          <nav className="sp-breadcrumb">
            <button onClick={() => navigateTo('/')} className="sp-breadcrumb-link">Home</button>
            <span>›</span>
            <span>Shipping & Returns</span>
          </nav>
          <div className="sp-hero-badge">🚚 Pan India Delivery</div>
          <h1 className="sp-hero-title">Shipping & Returns Policy</h1>
          <p className="sp-hero-sub">
            Transparent, sustainable, and reliable delivery for every eco-friendly order across India.
          </p>
        </div>
      </div>

      {/* Stat Strip */}
      <div className="sp-stats-strip">
        {stats.map((s, i) => (
          <div key={i} className="sp-stat">
            <div className="sp-stat-icon">{s.icon}</div>
            <div className="sp-stat-label">{s.label}</div>
            <div className="sp-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <main className="sp-main">

        {/* Section 1: Shipping Rates */}
        <div className="sp-section">
          <div className="sp-section-head">
            <div className="sp-section-badge">01</div>
            <h2 className="sp-section-title">Shipping Rates</h2>
          </div>
          <div className="sp-rate-grid">
            <div className="sp-rate-card sp-rate-card--green">
              <div className="sp-rate-card-icon">🆓</div>
              <div className="sp-rate-card-amount">FREE</div>
              <div className="sp-rate-card-cond">On orders ₹999 & above</div>
              <div className="sp-rate-card-note">Delivered across all serviceable pin codes in India via our trusted courier partners.</div>
            </div>
            <div className="sp-rate-card sp-rate-card--brown">
              <div className="sp-rate-card-icon">🏷️</div>
              <div className="sp-rate-card-amount">₹150</div>
              <div className="sp-rate-card-cond">Flat fee for orders below ₹999</div>
              <div className="sp-rate-card-note">A nominal fee to cover courier partner costs on smaller orders.</div>
            </div>
          </div>
          <div className="sp-callout sp-callout--blue">
            <span>💡</span>
            <p>Free shipping threshold applies to the product subtotal, <strong>before</strong> applying any discount codes. Membership pickup logistics are handled separately as described in your plan.</p>
          </div>
        </div>

        {/* Section 2: Dispatch & Delivery */}
        <div className="sp-section">
          <div className="sp-section-head">
            <div className="sp-section-badge">02</div>
            <h2 className="sp-section-title">Dispatch & Delivery Timelines</h2>
          </div>
          <p className="sp-text mb-4">
            Since every product is lovingly handcrafted by our artisans, we dispatch within <strong>2–3 business days</strong> from our workshop in Kanpur, UP. Delivery timelines from dispatch:
          </p>
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Cities / Regions</th>
                  <th>Delivery Time</th>
                </tr>
              </thead>
              <tbody>
                {deliveryRows.map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.zone}</strong></td>
                    <td>{r.cities}</td>
                    <td><span className="sp-badge-time">{r.time}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sp-callout sp-callout--green">
            <span>📲</span>
            <p>Once dispatched, you will receive a <strong>tracking link via SMS and email</strong> within 24 hours. For tracking issues, call us at <a href="tel:+919129455565" className="sp-link">+91 9129-45-55-65</a>.</p>
          </div>
        </div>

        {/* Section 3: Eco Packaging */}
        <div className="sp-section">
          <div className="sp-section-head">
            <div className="sp-section-badge">03</div>
            <h2 className="sp-section-title">Our Eco-Friendly Packaging</h2>
          </div>
          <p className="sp-text mb-4">
            Packaging is an extension of our sustainability mission. We take pride in shipping responsibly:
          </p>
          <ul className="sp-list">
            <li>All products are wrapped in <strong>recycled kraft paper</strong> or upcycled fabric — zero plastic bubble wrap.</li>
            <li>Outer boxes are made from <strong>100% recycled corrugated cardboard</strong> and can be repurposed at home.</li>
            <li>Filling material is shredded recycled paper, not foam pellets.</li>
            <li>Printed invoices use minimal ink; a digital invoice is emailed simultaneously to reduce paper use.</li>
          </ul>
        </div>

        {/* Section 4: Returns & Exchange */}
        <div className="sp-section">
          <div className="sp-section-head">
            <div className="sp-section-badge">04</div>
            <h2 className="sp-section-title">Return & Exchange Policy</h2>
          </div>
          <p className="sp-text mb-4">
            We stand behind the quality of every handcrafted product. If you are not completely satisfied, here is what we offer:
          </p>

          <div className="sp-return-grid">
            <div className="sp-return-card sp-return-card--eligible">
              <h3 className="sp-return-card-title">✅ Eligible for Return / Exchange</h3>
              <ul className="sp-mini-list">
                <li>Item received in damaged or defective condition (report within 48 hours with photos)</li>
                <li>Incorrect item shipped (wrong product or colour)</li>
                <li>Significantly different from product description</li>
                <li>Raised within <strong>7 days</strong> of delivery</li>
              </ul>
            </div>
            <div className="sp-return-card sp-return-card--not-eligible">
              <h3 className="sp-return-card-title">❌ Not Eligible for Return</h3>
              <ul className="sp-mini-list">
                <li>Items with minor natural variations in texture, weave, or colour (inherent to handcraft)</li>
                <li>Products that have been used, washed, or altered</li>
                <li>Return requests raised after 7 days from delivery</li>
                <li>Membership carton pickup plans (non-refundable once pickup is scheduled)</li>
              </ul>
            </div>
          </div>

          <div className="sp-steps">
            <div className="sp-steps-title">How to Request a Return (3 Simple Steps)</div>
            <div className="sp-step-list">
              <div className="sp-step">
                <div className="sp-step-num">1</div>
                <div>
                  <strong>Email us</strong> at <a href="mailto:info@nivaranupcyclers.in" className="sp-link">info@nivaranupcyclers.in</a> with your order number and clear photos of the issue within 7 days of delivery.
                </div>
              </div>
              <div className="sp-step">
                <div className="sp-step-num">2</div>
                <div>
                  Our team will <strong>review and confirm</strong> the return/exchange eligibility within 2–3 business days and provide a return shipping label (for eligible claims).
                </div>
              </div>
              <div className="sp-step">
                <div className="sp-step-num">3</div>
                <div>
                  Once we receive and inspect the returned item, your <strong>refund or replacement</strong> will be processed within 5–7 business days. Refunds go back to the original payment method.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Membership Pickups */}
        <div className="sp-section">
          <div className="sp-section-head">
            <div className="sp-section-badge">05</div>
            <h2 className="sp-section-title">Membership Carton Pickup Logistics</h2>
          </div>
          <p className="sp-text mb-4">
            Our Annual Membership Plans include doorstep reverse-logistics. Here is how it works:
          </p>
          <ul className="sp-list">
            <li><strong>Carton Dispatch:</strong> We send your membership carton(s) via courier within 3–5 business days of successful payment and verification.</li>
            <li><strong>Pickup Scheduling:</strong> Once your carton is full (up to 5 kg of dry pooja materials), WhatsApp or call us at <a href="tel:+919129455565" className="sp-link">+91 9129-45-55-65</a> to schedule a reverse pickup at your convenience.</li>
            <li><strong>Service Area:</strong> Pickup service is currently available across UP, Delhi NCR, and select metro cities. Pan-India reverse logistics are being expanded progressively.</li>
            <li><strong>Validity:</strong> Pickups must be scheduled within your plan's validity period (3, 6, or 12 months depending on plan chosen). Expired pickups cannot be rescheduled.</li>
          </ul>
        </div>

        {/* Section 6: Cancellations */}
        <div className="sp-section">
          <div className="sp-section-head">
            <div className="sp-section-badge">06</div>
            <h2 className="sp-section-title">Order Cancellations</h2>
          </div>
          <ul className="sp-list">
            <li>Orders can be cancelled within <strong>12 hours</strong> of placement at no charge. Email us immediately.</li>
            <li>After 12 hours, if the item has not yet been dispatched, a partial refund may be issued after deducting packing and material costs.</li>
            <li>Orders already dispatched <strong>cannot be cancelled</strong> — please initiate a return after delivery instead.</li>
            <li>Membership plans: Cancelled before carton dispatch = full refund within 5 business days.</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="sp-contact-block">
          <div>
            <h3 className="sp-contact-title">Need Help With Your Order?</h3>
            <p className="sp-contact-sub">Our support team is available Monday – Saturday, 10 AM – 6 PM IST.</p>
          </div>
          <div className="sp-contact-actions">
            <a href="mailto:info@nivaranupcyclers.in" className="sp-contact-btn sp-contact-btn--primary">
              📧 Email Support
            </a>
            <a href="tel:+919129455565" className="sp-contact-btn sp-contact-btn--outline">
              📞 +91 9129-45-55-65
            </a>
          </div>
        </div>

      </main>

      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .sp-root {
          min-height: 100vh;
          background: #F8F5F0;
          font-family: 'Inter', sans-serif;
          color: #1a1a1a;
        }

        /* Hero */
        .sp-hero {
          background: linear-gradient(135deg, #4a2c0a 0%, #7c4d1e 60%, #a0622a 100%);
          padding: 48px 20px 56px;
          position: relative;
          overflow: hidden;
        }
        .sp-hero::after {
          content: '🚚';
          position: absolute;
          right: 8%;
          top: 50%;
          transform: translateY(-50%);
          font-size: 120px;
          opacity: 0.07;
          pointer-events: none;
        }
        .sp-hero-inner { max-width: 800px; margin: 0 auto; }
        .sp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 24px;
        }
        .sp-breadcrumb-link {
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-size: 13px;
          padding: 0;
          transition: color 0.2s;
        }
        .sp-breadcrumb-link:hover { color: #F8D548; }
        .sp-hero-badge {
          display: inline-block;
          background: rgba(248,213,72,0.15);
          border: 1px solid rgba(248,213,72,0.4);
          color: #F8D548;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 999px;
          margin-bottom: 16px;
        }
        .sp-hero-title {
          font-size: clamp(26px, 5vw, 42px);
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 14px;
          line-height: 1.15;
        }
        .sp-hero-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.75);
          line-height: 1.6;
          max-width: 580px;
        }

        /* Stats Strip */
        .sp-stats-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #ffffff;
          border-bottom: 1px solid #e8e2d8;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        .sp-stat {
          padding: 20px 16px;
          text-align: center;
          border-right: 1px solid #e8e2d8;
        }
        .sp-stat:last-child { border-right: none; }
        .sp-stat-icon { font-size: 24px; margin-bottom: 6px; }
        .sp-stat-label { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }
        .sp-stat-sub { font-size: 11.5px; color: #9ca3af; }

        /* Main */
        .sp-main {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px 60px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Section */
        .sp-section {
          background: #ffffff;
          border: 1px solid #e8e2d8;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .sp-section-head {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .sp-section-badge {
          background: #4a2c0a;
          color: #F8D548;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .sp-section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }
        .sp-text {
          font-size: 14.5px;
          line-height: 1.75;
          color: #4b5563;
        }
        .mb-4 { margin-bottom: 16px; }

        /* Rate Cards */
        .sp-rate-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .sp-rate-card {
          border-radius: 16px;
          padding: 24px;
          text-align: center;
        }
        .sp-rate-card--green {
          background: #f0fdf4;
          border: 2px solid #86efac;
        }
        .sp-rate-card--brown {
          background: #fefce8;
          border: 2px solid #fde68a;
        }
        .sp-rate-card-icon { font-size: 28px; margin-bottom: 8px; }
        .sp-rate-card-amount {
          font-size: 32px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .sp-rate-card-cond {
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 10px;
        }
        .sp-rate-card-note { font-size: 12px; color: #6b7280; line-height: 1.5; }

        /* Callout */
        .sp-callout {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 12px;
          font-size: 13.5px;
          line-height: 1.65;
        }
        .sp-callout--blue { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
        .sp-callout--green { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
        .sp-callout strong { font-weight: 700; }

        /* Delivery Table */
        .sp-table-wrap {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #e8e2d8;
          margin-bottom: 16px;
        }
        .sp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        .sp-table th {
          background: #F8F5F0;
          padding: 12px 16px;
          text-align: left;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6b7280;
          border-bottom: 1px solid #e8e2d8;
        }
        .sp-table td {
          padding: 13px 16px;
          border-bottom: 1px solid #f3f0eb;
          color: #374151;
          vertical-align: middle;
        }
        .sp-table tr:last-child td { border-bottom: none; }
        .sp-badge-time {
          display: inline-block;
          background: #FFF6D1;
          color: #4a2c0a;
          font-size: 12px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }

        /* List */
        .sp-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sp-list li {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.65;
          padding-left: 20px;
          position: relative;
        }
        .sp-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #F8D548;
          font-weight: 700;
        }
        .sp-list li strong { color: #1a1a1a; }
        .sp-link {
          color: #4a2c0a;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .sp-link:hover { color: #F8D548; }

        /* Return Cards */
        .sp-return-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .sp-return-card {
          border-radius: 14px;
          padding: 20px;
        }
        .sp-return-card--eligible {
          background: #f0fdf4;
          border: 1px solid #86efac;
        }
        .sp-return-card--not-eligible {
          background: #fff1f2;
          border: 1px solid #fecdd3;
        }
        .sp-return-card-title {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 12px;
        }
        .sp-mini-list {
          list-style: disc;
          padding-left: 18px;
          margin: 0;
        }
        .sp-mini-list li {
          font-size: 13px;
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 6px;
        }
        .sp-mini-list li strong { color: #1a1a1a; }

        /* Steps */
        .sp-steps {
          background: #F8F5F0;
          border-radius: 14px;
          padding: 24px;
        }
        .sp-steps-title {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 16px;
        }
        .sp-step-list { display: flex; flex-direction: column; gap: 14px; }
        .sp-step {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          font-size: 13.5px;
          color: #4b5563;
          line-height: 1.6;
        }
        .sp-step strong { color: #1a1a1a; }
        .sp-step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #4a2c0a;
          color: #F8D548;
          font-size: 13px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Contact */
        .sp-contact-block {
          background: linear-gradient(135deg, #4a2c0a, #7c4d1e);
          border-radius: 20px;
          padding: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          color: white;
          flex-wrap: wrap;
        }
        .sp-contact-title { font-size: 20px; font-weight: 700; margin: 0 0 6px; }
        .sp-contact-sub { font-size: 14px; color: rgba(255,255,255,0.75); margin: 0; }
        .sp-contact-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .sp-contact-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 12px 22px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .sp-contact-btn--primary {
          background: #F8D548;
          color: #1a1a1a;
        }
        .sp-contact-btn--primary:hover { background: #ffe566; }
        .sp-contact-btn--outline {
          border: 2px solid rgba(255,255,255,0.6);
          color: white;
        }
        .sp-contact-btn--outline:hover { background: rgba(255,255,255,0.1); }

        @media (max-width: 640px) {
          .sp-stats-strip { grid-template-columns: repeat(2, 1fr); }
          .sp-stat { border-bottom: 1px solid #e8e2d8; }
          .sp-rate-grid { grid-template-columns: 1fr; }
          .sp-return-grid { grid-template-columns: 1fr; }
          .sp-section { padding: 20px; }
          .sp-contact-block { flex-direction: column; align-items: flex-start; padding: 24px; }
          .sp-hero { padding: 36px 16px 44px; }
        }
      `}</style>
    </div>
  );
}

export default ShippingPage;
