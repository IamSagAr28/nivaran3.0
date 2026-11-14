import React, { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useRouter } from '../utils/Router';
import { usePageSeo } from '../utils/usePageSeo';

export function TermsPage() {
  const { navigateTo } = useRouter();

  usePageSeo('/terms-of-service', {
    title: 'Terms of Service | Nivaran Upcyclers',
    description: 'Terms of Service and Conditions for using Nivaran Upcyclers website and ordering handcrafted sustainable items.',
    canonical: 'https://www.nivaranupcyclers.com/terms-of-service'
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const sections = [
    {
      num: '01',
      title: 'Agreement to Terms',
      content: (
        <p className="tp-text">
          By accessing or using the Nivaran Upcyclers website (<strong>www.nivaranupcyclers.com</strong>), placing an order for products, booking a upcycling workshop, or enrolling in our Annual Membership Pickup Plans, you agree to be fully bound by these Terms of Service and our Privacy Policy. If you do not agree with any part of these terms, please refrain from using our services.
        </p>
      ),
    },
    {
      num: '02',
      title: 'Nature of Upcycled & Handcrafted Products',
      content: (
        <>
          <p className="tp-text mb-3">
            Nivaran Upcyclers creates eco-friendly products crafted by skilled women artisans using upcycled pooja textile waste and sustainable materials. Each product is unique by nature.
          </p>
          <div className="tp-alert tp-alert--amber">
            <span className="tp-alert-icon">⚠️</span>
            <div>
              <strong>Important – Natural Variations:</strong> Because each item is handmade from unique repurposed textiles, slight variations in weave pattern, texture, and colour tone are inherent characteristics of authentic artisan craft and are <strong>not</strong> product defects. These variations celebrate the individuality of sustainable handcraft and are not eligible for returns.
            </div>
          </div>
        </>
      ),
    },
    {
      num: '03',
      title: 'Annual Membership & Pickup Plans',
      content: (
        <>
          <p className="tp-text mb-4">
            Our Annual Membership Pickup Plans allow households across India to respectfully dispose of sacred pooja materials (Nirmalya) through our circular economy model.
          </p>
          <div className="tp-mem-grid">
            <div className="tp-mem-card">
              <div className="tp-mem-card-icon">📦</div>
              <div className="tp-mem-card-title">Cartons Provided</div>
              <p className="tp-mem-card-text">We send standard cartons to your doorstep. Fill with dry pooja materials (cloth, dry flowers, paper) up to <strong>5 kg per carton</strong>.</p>
            </div>
            <div className="tp-mem-card">
              <div className="tp-mem-card-icon">📅</div>
              <div className="tp-mem-card-title">Pickup Scheduling</div>
              <p className="tp-mem-card-text">When full, contact us via WhatsApp or phone to schedule a reverse pickup within your plan's validity period.</p>
            </div>
            <div className="tp-mem-card">
              <div className="tp-mem-card-icon">🎁</div>
              <div className="tp-mem-card-title">Catalogue Gift</div>
              <p className="tp-mem-card-text">Select upcycled products worth ₹600 from our catalogue as part of your membership. Cannot be exchanged for cash.</p>
            </div>
            <div className="tp-mem-card">
              <div className="tp-mem-card-icon">🚫</div>
              <div className="tp-mem-card-title">Prohibited Items</div>
              <p className="tp-mem-card-text">Plastic, electronic items, glass, wet/mouldy materials, or hazardous waste must <strong>never</strong> be placed in pooja collection cartons.</p>
            </div>
          </div>
          <div className="tp-alert tp-alert--red">
            <span className="tp-alert-icon">🚫</span>
            <div>Membership plans are <strong>non-refundable once a pickup has been scheduled</strong>. If a carton dispatch has already occurred, the plan cannot be cancelled. Please refer to our Shipping & Returns Policy for full details.</div>
          </div>
        </>
      ),
    },
    {
      num: '04',
      title: 'Pricing, Payments & Invoices',
      content: (
        <>
          <ul className="tp-list">
            <li>All prices listed are in <strong>Indian Rupees (INR)</strong> and are inclusive of applicable GST unless explicitly stated otherwise.</li>
            <li>Payments are processed securely via <strong>Razorpay</strong> (RBI-compliant payment gateway). We accept UPI, credit/debit cards, net banking, and EMI options.</li>
            <li>Orders are confirmed only upon <strong>successful receipt of full payment</strong>. We reserve the right to cancel unconfirmed or fraudulent orders.</li>
            <li>A GST invoice will be emailed to your registered email address within 24 hours of order confirmation.</li>
            <li>Prices may change without prior notice. The price at the time of order placement is the binding price for that transaction.</li>
          </ul>
        </>
      ),
    },
    {
      num: '05',
      title: 'Workshops & Training Sessions',
      content: (
        <>
          <p className="tp-text mb-3">
            Nivaran Upcyclers conducts fabric upcycling workshops for schools, colleges, residential societies, and corporate groups.
          </p>
          <ul className="tp-list">
            <li>Workshop bookings must be confirmed via a signed agreement and advance payment before the session date.</li>
            <li>Cancellation of confirmed workshops by the client within <strong>72 hours of the scheduled date</strong> will incur a 50% cancellation fee.</li>
            <li>We reserve the right to reschedule workshops due to unforeseen operational circumstances. We will provide at least 48 hours advance notice.</li>
            <li>The client is responsible for providing adequate venue space, seating, and basic utilities (power, water) as communicated in the pre-session checklist.</li>
          </ul>
        </>
      ),
    },
    {
      num: '06',
      title: 'User Accounts & Security',
      content: (
        <>
          <p className="tp-text mb-3">
            When you create an account on our website, you are responsible for:
          </p>
          <ul className="tp-list">
            <li>Maintaining the confidentiality of your login credentials.</li>
            <li>All activity that occurs under your account, whether authorised by you or not.</li>
            <li>Notifying us immediately at <a href="mailto:info@nivaranupcyclers.in" className="tp-link">info@nivaranupcyclers.in</a> if you suspect any unauthorised access.</li>
          </ul>
          <p className="tp-text mt-3">
            We reserve the right to suspend or terminate accounts engaged in fraudulent activity, abuse, or violations of these terms.
          </p>
        </>
      ),
    },
    {
      num: '07',
      title: 'Intellectual Property',
      content: (
        <>
          <p className="tp-text mb-3">
            All content on this website — including but not limited to designs, branding, logos, the trademarked name <strong>"Nivaran Upcyclers™"</strong>, photographs, product imagery, and written content — is the exclusive intellectual property of Nivaran Upcyclers.
          </p>
          <ul className="tp-list">
            <li>You may not reproduce, distribute, or commercially exploit any content without our explicit written permission.</li>
            <li>Personal, non-commercial sharing of content (e.g., social media posts tagging us) is welcomed and encouraged.</li>
            <li>Plagiarism of product descriptions, designs, or website content may result in legal action.</li>
          </ul>
        </>
      ),
    },
    {
      num: '08',
      title: 'Limitation of Liability',
      content: (
        <>
          <p className="tp-text mb-3">
            To the maximum extent permitted under applicable Indian law, Nivaran Upcyclers shall not be liable for:
          </p>
          <ul className="tp-list">
            <li>Indirect, incidental, or consequential damages arising from the use of our products or services.</li>
            <li>Losses arising from courier delays, force majeure events, or circumstances beyond our reasonable control.</li>
            <li>Damage caused by improper use, washing, or storage of our handcrafted products inconsistent with care instructions provided.</li>
          </ul>
          <p className="tp-text mt-3">
            Our maximum liability in any case shall not exceed the total amount paid by you for the specific product or service giving rise to the claim.
          </p>
        </>
      ),
    },
    {
      num: '09',
      title: 'Governing Law & Dispute Resolution',
      content: (
        <>
          <p className="tp-text mb-3">
            These Terms of Service shall be governed by and construed in accordance with the laws of India, specifically:
          </p>
          <ul className="tp-list">
            <li>The Consumer Protection Act, 2019</li>
            <li>The Information Technology Act, 2000 and applicable Rules</li>
            <li>The Indian Contract Act, 1872</li>
          </ul>
          <p className="tp-text mt-3">
            Any disputes arising out of these terms shall first be attempted to be resolved through good-faith negotiation. Unresolved disputes shall be subject to the exclusive jurisdiction of competent courts in <strong>Kanpur, Uttar Pradesh, India</strong>.
          </p>
        </>
      ),
    },
    {
      num: '10',
      title: 'Changes to Terms',
      content: (
        <p className="tp-text">
          Nivaran Upcyclers reserves the right to modify these Terms of Service at any time. Updated terms will be posted on this page with a revised effective date. Your continued use of our website or services after changes are posted constitutes your acceptance of the modified terms. We recommend reviewing these terms periodically.
        </p>
      ),
    },
  ];

  return (
    <div className="tp-root">
      <Header showCategories={false} />

      {/* Hero */}
      <div className="tp-hero">
        <div className="tp-hero-inner">
          <nav className="tp-breadcrumb">
            <button onClick={() => navigateTo('/')} className="tp-breadcrumb-link">Home</button>
            <span>›</span>
            <span>Terms of Service</span>
          </nav>
          <div className="tp-hero-badge">📋 Official Agreement</div>
          <h1 className="tp-hero-title">Terms of Service</h1>
          <p className="tp-hero-sub">
            Please read these terms carefully before using our website, purchasing products, booking workshops, or enrolling in our membership plans.
          </p>
          <div className="tp-hero-meta">
            Last updated: <strong>October 2026</strong> &nbsp;·&nbsp; Nivaran Upcyclers, Kanpur, UP, India
          </div>
        </div>
      </div>

      <main className="tp-main">
        <div className="tp-toc">
          <div className="tp-toc-label">Table of Contents</div>
          {sections.map(s => (
            <a key={s.num} href={`#tp-section-${s.num}`} className="tp-toc-item">
              <span className="tp-toc-num">{s.num}</span>
              <span>{s.title}</span>
            </a>
          ))}
        </div>

        <div className="tp-sections">
          {sections.map(s => (
            <section key={s.num} id={`tp-section-${s.num}`} className="tp-section">
              <div className="tp-section-head">
                <div className="tp-section-badge">{s.num}</div>
                <h2 className="tp-section-title">{s.title}</h2>
              </div>
              {s.content}
            </section>
          ))}

          {/* Contact */}
          <div className="tp-contact-block">
            <div className="tp-contact-icon">⚖️</div>
            <div>
              <h3 className="tp-contact-title">Questions About These Terms?</h3>
              <p className="tp-contact-sub">Contact our legal/compliance team. We respond within 3 business days.</p>
              <div className="tp-contact-details">
                <div><strong>Nivaran Upcyclers</strong></div>
                <div>117/Q/39 Radha Krishna Housing Society, Sharda Nagar, Kanpur, UP - 208025</div>
                <div>
                  📧 <a href="mailto:info@nivaranupcyclers.in" className="tp-link tp-link--light">info@nivaranupcyclers.in</a>
                  &nbsp;&nbsp;
                  📞 <a href="tel:+919129455565" className="tp-link tp-link--light">+91 9129-45-55-65</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .tp-root {
          min-height: 100vh;
          background: #F8F5F0;
          font-family: 'Inter', sans-serif;
          color: #1a1a1a;
        }

        /* Hero */
        .tp-hero {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
          padding: 48px 20px 56px;
          position: relative;
          overflow: hidden;
        }
        .tp-hero::after {
          content: '📋';
          position: absolute;
          right: 8%;
          top: 50%;
          transform: translateY(-50%);
          font-size: 120px;
          opacity: 0.07;
          pointer-events: none;
        }
        .tp-hero-inner { max-width: 800px; margin: 0 auto; }
        .tp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          margin-bottom: 24px;
        }
        .tp-breadcrumb-link {
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-size: 13px;
          padding: 0;
          transition: color 0.2s;
        }
        .tp-breadcrumb-link:hover { color: #F8D548; }
        .tp-hero-badge {
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
        .tp-hero-title {
          font-size: clamp(26px, 5vw, 42px);
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 14px;
          line-height: 1.15;
        }
        .tp-hero-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.72);
          line-height: 1.65;
          max-width: 580px;
          margin-bottom: 20px;
        }
        .tp-hero-meta {
          font-size: 12.5px;
          color: rgba(255,255,255,0.45);
        }

        /* Layout */
        .tp-main {
          max-width: 1080px;
          margin: 0 auto;
          padding: 40px 20px 60px;
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 40px;
          align-items: start;
        }

        /* TOC */
        .tp-toc {
          position: sticky;
          top: 24px;
          background: #ffffff;
          border: 1px solid #e8e2d8;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }
        .tp-toc-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 14px;
        }
        .tp-toc-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #4b5563;
          text-decoration: none;
          padding: 6px 0;
          border-bottom: 1px solid #f3f0eb;
          transition: color 0.2s;
        }
        .tp-toc-item:last-child { border-bottom: none; }
        .tp-toc-item:hover { color: #0f3460; }
        .tp-toc-num {
          font-size: 10px;
          font-weight: 800;
          color: #F8D548;
          background: #0f3460;
          border-radius: 4px;
          padding: 2px 5px;
          flex-shrink: 0;
        }

        /* Sections */
        .tp-sections { display: flex; flex-direction: column; gap: 12px; }
        .tp-section {
          background: #ffffff;
          border: 1px solid #e8e2d8;
          border-radius: 16px;
          padding: 28px 32px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          scroll-margin-top: 24px;
        }
        .tp-section-head {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }
        .tp-section-badge {
          background: #0f3460;
          color: #F8D548;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .tp-section-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f3460;
          margin: 0;
        }

        .tp-text {
          font-size: 14.5px;
          line-height: 1.75;
          color: #4b5563;
        }
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .mt-3 { margin-top: 12px; }

        .tp-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tp-list li {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.65;
          padding-left: 20px;
          position: relative;
        }
        .tp-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #F8D548;
          font-weight: 700;
        }
        .tp-list li strong { color: #1a1a1a; }

        .tp-link {
          color: #0f3460;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .tp-link:hover { color: #F8D548; }
        .tp-link--light { color: #F8D548; }
        .tp-link--light:hover { color: #ffffff; }

        /* Alerts */
        .tp-alert {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 12px;
          margin-top: 16px;
          font-size: 13.5px;
          line-height: 1.65;
        }
        .tp-alert--amber { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
        .tp-alert--red { background: #fff1f2; border: 1px solid #fecdd3; color: #9f1239; }
        .tp-alert-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .tp-alert strong { font-weight: 700; }

        /* Membership Cards */
        .tp-mem-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .tp-mem-card {
          background: #F8F5F0;
          border: 1px solid #e8e2d8;
          border-radius: 12px;
          padding: 18px;
        }
        .tp-mem-card-icon { font-size: 22px; margin-bottom: 8px; }
        .tp-mem-card-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f3460;
          margin-bottom: 6px;
        }
        .tp-mem-card-text { font-size: 12.5px; color: #6b7280; line-height: 1.55; margin: 0; }
        .tp-mem-card-text strong { color: #1a1a1a; }

        /* Contact */
        .tp-contact-block {
          background: linear-gradient(135deg, #1a1a2e, #0f3460);
          border-radius: 20px;
          padding: 32px;
          display: flex;
          gap: 20px;
          align-items: flex-start;
          color: white;
          margin-top: 8px;
        }
        .tp-contact-icon { font-size: 36px; flex-shrink: 0; }
        .tp-contact-title { font-size: 20px; font-weight: 700; margin: 0 0 6px; }
        .tp-contact-sub { font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 14px; }
        .tp-contact-details { font-size: 13.5px; color: rgba(255,255,255,0.85); line-height: 1.8; }

        @media (max-width: 860px) {
          .tp-main { grid-template-columns: 1fr; }
          .tp-toc { position: static; }
        }

        @media (max-width: 540px) {
          .tp-section { padding: 20px; flex-direction: column; }
          .tp-mem-grid { grid-template-columns: 1fr; }
          .tp-contact-block { flex-direction: column; padding: 24px; }
          .tp-hero { padding: 36px 16px 44px; }
        }
      `}</style>
    </div>
  );
}

export default TermsPage;
