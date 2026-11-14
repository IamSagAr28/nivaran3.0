import React, { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useRouter } from '../utils/Router';
import { usePageSeo } from '../utils/usePageSeo';

export function PrivacyPage() {
  const { navigateTo } = useRouter();

  usePageSeo('/privacy-policy', {
    title: 'Privacy Policy | Nivaran Upcyclers',
    description: 'Privacy Policy of Nivaran Upcyclers. Learn how we handle and protect your personal information.',
    canonical: 'https://www.nivaranupcyclers.com/privacy-policy'
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const sections = [
    {
      num: '01',
      title: 'Information We Collect',
      content: (
        <>
          <p className="pp-text mb-4">
            At Nivaran Upcyclers ("we", "our", or "us"), we respect your personal privacy. When you visit our website, register for membership, purchase handcrafted upcycled products, or book workshops, we may collect the following information:
          </p>
          <div className="pp-grid">
            <div className="pp-card">
              <div className="pp-card-icon">👤</div>
              <div className="pp-card-label">Personal Details</div>
              <div className="pp-card-desc">Name, email address, phone number, and physical delivery address.</div>
            </div>
            <div className="pp-card">
              <div className="pp-card-icon">🛍️</div>
              <div className="pp-card-label">Order Records</div>
              <div className="pp-card-desc">Details about products, membership pickups, and transaction history. Payment card numbers are never stored — processed securely via Razorpay.</div>
            </div>
            <div className="pp-card">
              <div className="pp-card-icon">💬</div>
              <div className="pp-card-label">Communication</div>
              <div className="pp-card-desc">Queries from our contact form, workshop registrations, or customer support helpline.</div>
            </div>
            <div className="pp-card">
              <div className="pp-card-icon">🌐</div>
              <div className="pp-card-label">Usage Data</div>
              <div className="pp-card-desc">Browser type, pages visited, and interaction data collected via anonymised cookies for site improvement only.</div>
            </div>
          </div>
        </>
      ),
    },
    {
      num: '02',
      title: 'How We Use Your Information',
      content: (
        <>
          <p className="pp-text mb-4">Your information is strictly used for legitimate business and social mission operations:</p>
          <ul className="pp-list">
            <li><strong>Order Fulfillment:</strong> Processing eco-friendly product shipments and scheduling doorstep carton pickups for members.</li>
            <li><strong>Notifications & Updates:</strong> Sending transactional updates, tracking codes, pickup confirmations, and GST invoices.</li>
            <li><strong>Workshop Coordination:</strong> Coordinating dates, venues, and materials for upcycling training sessions.</li>
            <li><strong>Customer Support:</strong> Responding to queries and resolving issues related to orders, returns, or memberships.</li>
            <li><strong>Social Impact Reports:</strong> Measuring and reporting on environmental waste diverted from landfills and the River Ganga.</li>
          </ul>
          <div className="pp-callout pp-callout--green">
            <span className="pp-callout-icon">✅</span>
            <p>We will <strong>never</strong> use your data for unsolicited marketing without your explicit consent. All marketing communications include an easy unsubscribe option.</p>
          </div>
        </>
      ),
    },
    {
      num: '03',
      title: 'Data Sharing & Third Parties',
      content: (
        <>
          <p className="pp-text mb-4">
            We <strong>NEVER sell, rent, or trade</strong> your personal information to third-party advertisers or data brokers. Information is shared only with trusted service providers who are contractually bound to protect your data:
          </p>
          <ul className="pp-list">
            <li><strong>Delivery Partners:</strong> Indian courier companies (DTDC, BlueDart, India Post) receive your name and address solely to complete delivery.</li>
            <li><strong>Payment Processors:</strong> Razorpay processes payments under RBI guidelines. We receive only transaction confirmation, not your card details.</li>
            <li><strong>Legal Compliance:</strong> We may disclose information if required by law, court order, or government authority.</li>
          </ul>
        </>
      ),
    },
    {
      num: '04',
      title: 'Cookies & Tracking',
      content: (
        <>
          <p className="pp-text mb-3">Our website uses minimal, privacy-friendly cookies for the following purposes only:</p>
          <ul className="pp-list">
            <li><strong>Session Cookies:</strong> To keep you logged in and maintain your cart while browsing.</li>
            <li><strong>Analytics Cookies:</strong> Anonymised page-view counters to understand which content helps our visitors most.</li>
            <li><strong>Preference Cookies:</strong> To remember your preferred city or language settings.</li>
          </ul>
          <p className="pp-text mt-3">You may disable cookies in your browser settings at any time. Core site features may be affected.</p>
        </>
      ),
    },
    {
      num: '05',
      title: 'Data Security',
      content: (
        <>
          <p className="pp-text mb-3">
            We implement industry-standard security to protect your information:
          </p>
          <ul className="pp-list">
            <li>256-bit SSL/TLS encryption for all data transmitted between your browser and our servers.</li>
            <li>Restricted database access — only authorised staff can access customer records.</li>
            <li>Regular security audits and software update patches.</li>
            <li>Passwords stored using one-way cryptographic hashing (bcrypt) — we cannot see your password.</li>
          </ul>
          <div className="pp-callout pp-callout--yellow">
            <span className="pp-callout-icon">⚠️</span>
            <p>No method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. Please use a strong, unique password for your account.</p>
          </div>
        </>
      ),
    },
    {
      num: '06',
      title: 'Your Rights',
      content: (
        <>
          <p className="pp-text mb-4">Under applicable Indian data protection laws, you have the right to:</p>
          <ul className="pp-list">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Ask us to correct inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> Request erasure of your personal data (subject to legal obligations).</li>
            <li><strong>Opt-Out:</strong> Withdraw consent for marketing communications at any time.</li>
            <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
          </ul>
          <p className="pp-text mt-3">To exercise any of these rights, email us at <a href="mailto:info@nivaranupcyclers.in" className="pp-link">info@nivaranupcyclers.in</a>. We will respond within 30 days.</p>
        </>
      ),
    },
    {
      num: '07',
      title: 'Children\'s Privacy',
      content: (
        <p className="pp-text">
          Our services are not directed at children under the age of 18. We do not knowingly collect personal information from minors. If you believe a child has provided us with personal data, please contact us immediately and we will delete it promptly.
        </p>
      ),
    },
    {
      num: '08',
      title: 'Changes to This Policy',
      content: (
        <p className="pp-text">
          We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. The revised policy will be posted on this page with an updated effective date. We encourage you to review this page periodically. Continued use of our website after changes constitutes your acceptance of the revised policy.
        </p>
      ),
    },
  ];

  return (
    <div className="pp-root">
      <Header showCategories={false} />

      <div className="pp-hero">
        <div className="pp-hero-inner">
          <nav className="pp-breadcrumb">
            <button onClick={() => navigateTo('/')} className="pp-breadcrumb-link">Home</button>
            <span className="pp-breadcrumb-sep">›</span>
            <span>Privacy Policy</span>
          </nav>
          <div className="pp-hero-badge">🔒 Your Privacy Matters</div>
          <h1 className="pp-hero-title">Privacy Policy</h1>
          <p className="pp-hero-sub">
            Nivaran Upcyclers is committed to protecting your privacy and being transparent about how we handle your data.
          </p>
          <div className="pp-hero-meta">
            Last updated: <strong>October 2026</strong> &nbsp;·&nbsp; Nivaran Upcyclers Pvt Ltd, Kanpur, UP
          </div>
        </div>
      </div>

      <main className="pp-main">
        <div className="pp-toc">
          <div className="pp-toc-label">Quick Navigation</div>
          {sections.map(s => (
            <a key={s.num} href={`#section-${s.num}`} className="pp-toc-item">
              <span className="pp-toc-num">{s.num}</span>
              <span>{s.title}</span>
            </a>
          ))}
        </div>

        <div className="pp-sections">
          {sections.map(s => (
            <section key={s.num} id={`section-${s.num}`} className="pp-section">
              <div className="pp-section-num">{s.num}</div>
              <div className="pp-section-body">
                <h2 className="pp-section-title">{s.title}</h2>
                {s.content}
              </div>
            </section>
          ))}

          {/* Contact Block */}
          <div className="pp-contact-block">
            <div className="pp-contact-icon">📬</div>
            <div>
              <h3 className="pp-contact-title">Privacy Questions?</h3>
              <p className="pp-contact-sub">Our privacy officer is happy to help with any data-related queries.</p>
              <div className="pp-contact-details">
                <div><strong>Nivaran Upcyclers</strong></div>
                <div>117/Q/39 Radha Krishna Housing Society, Sharda Nagar, Kanpur, UP - 208025</div>
                <div>
                  📧 <a href="mailto:info@nivaranupcyclers.in" className="pp-link">info@nivaranupcyclers.in</a>
                  &nbsp;&nbsp;
                  📞 <a href="tel:+919129455565" className="pp-link">+91 9129-45-55-65</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .pp-root {
          min-height: 100vh;
          background: #F8F5F0;
          font-family: 'Inter', sans-serif;
          color: #1a1a1a;
        }

        /* Hero */
        .pp-hero {
          background: linear-gradient(135deg, #1B3A28 0%, #2d5a3d 60%, #3a5a40 100%);
          padding: 48px 20px 56px;
          position: relative;
          overflow: hidden;
        }
        .pp-hero::after {
          content: '🔒';
          position: absolute;
          right: 8%;
          top: 50%;
          transform: translateY(-50%);
          font-size: 120px;
          opacity: 0.06;
          pointer-events: none;
        }
        .pp-hero-inner {
          max-width: 800px;
          margin: 0 auto;
        }
        .pp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 24px;
        }
        .pp-breadcrumb-link {
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-size: 13px;
          padding: 0;
          transition: color 0.2s;
        }
        .pp-breadcrumb-link:hover { color: #F8D548; }
        .pp-breadcrumb-sep { color: rgba(255,255,255,0.4); }
        .pp-hero-badge {
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
        .pp-hero-title {
          font-size: clamp(28px, 5vw, 44px);
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 14px;
          line-height: 1.15;
        }
        .pp-hero-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.75);
          line-height: 1.6;
          max-width: 600px;
          margin-bottom: 20px;
        }
        .pp-hero-meta {
          font-size: 12.5px;
          color: rgba(255,255,255,0.5);
        }

        /* Layout */
        .pp-main {
          max-width: 1080px;
          margin: 0 auto;
          padding: 40px 20px 60px;
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 40px;
          align-items: start;
        }

        /* TOC */
        .pp-toc {
          position: sticky;
          top: 24px;
          background: #fff;
          border: 1px solid #e8e2d8;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }
        .pp-toc-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 14px;
        }
        .pp-toc-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          color: #4b5563;
          text-decoration: none;
          padding: 7px 0;
          border-bottom: 1px solid #f3f0eb;
          transition: color 0.2s;
        }
        .pp-toc-item:last-child { border-bottom: none; }
        .pp-toc-item:hover { color: #1B3A28; }
        .pp-toc-num {
          font-size: 10px;
          font-weight: 800;
          color: #F8D548;
          background: #1B3A28;
          border-radius: 4px;
          padding: 2px 5px;
          flex-shrink: 0;
        }

        /* Sections */
        .pp-sections { display: flex; flex-direction: column; gap: 4px; }
        .pp-section {
          background: #ffffff;
          border: 1px solid #e8e2d8;
          border-radius: 16px;
          padding: 28px 32px;
          display: flex;
          gap: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          margin-bottom: 12px;
          scroll-margin-top: 24px;
        }
        .pp-section-num {
          font-size: 11px;
          font-weight: 800;
          color: #F8D548;
          background: #1B3A28;
          border-radius: 6px;
          padding: 4px 8px;
          height: fit-content;
          flex-shrink: 0;
          letter-spacing: 0.05em;
        }
        .pp-section-body { flex: 1; }
        .pp-section-title {
          font-size: 18px;
          font-weight: 700;
          color: #1B3A28;
          margin: 0 0 16px;
        }
        .pp-text {
          font-size: 14.5px;
          line-height: 1.75;
          color: #4b5563;
        }
        .pp-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pp-list li {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.65;
          padding-left: 20px;
          position: relative;
        }
        .pp-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #F8D548;
          font-weight: 700;
        }
        .pp-list li strong { color: #1a1a1a; }

        /* Cards grid */
        .pp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .pp-card {
          background: #F8F5F0;
          border: 1px solid #e8e2d8;
          border-radius: 12px;
          padding: 16px;
        }
        .pp-card-icon { font-size: 22px; margin-bottom: 8px; }
        .pp-card-label {
          font-size: 13px;
          font-weight: 700;
          color: #1B3A28;
          margin-bottom: 4px;
        }
        .pp-card-desc { font-size: 12.5px; color: #6b7280; line-height: 1.5; }

        /* Callouts */
        .pp-callout {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 12px;
          margin-top: 16px;
          font-size: 13.5px;
          line-height: 1.6;
        }
        .pp-callout--green {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }
        .pp-callout--yellow {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
        }
        .pp-callout-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .pp-link {
          color: #1B3A28;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .pp-link:hover { color: #F8D548; }

        /* Contact block */
        .pp-contact-block {
          background: linear-gradient(135deg, #1B3A28, #2d5a3d);
          border-radius: 20px;
          padding: 32px;
          display: flex;
          gap: 20px;
          align-items: flex-start;
          color: white;
          margin-top: 8px;
        }
        .pp-contact-icon { font-size: 36px; flex-shrink: 0; }
        .pp-contact-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 6px;
        }
        .pp-contact-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.7);
          margin-bottom: 14px;
        }
        .pp-contact-details {
          font-size: 13.5px;
          color: rgba(255,255,255,0.85);
          line-height: 1.8;
        }
        .pp-contact-block .pp-link {
          color: #F8D548;
          text-decoration: underline;
        }
        .pp-contact-block .pp-link:hover { color: white; }

        @media (max-width: 860px) {
          .pp-main {
            grid-template-columns: 1fr;
          }
          .pp-toc { position: static; }
        }

        @media (max-width: 540px) {
          .pp-section {
            flex-direction: column;
            padding: 20px;
            gap: 12px;
          }
          .pp-grid { grid-template-columns: 1fr; }
          .pp-contact-block { flex-direction: column; padding: 24px; }
          .pp-hero { padding: 36px 16px 44px; }
        }
      `}</style>
    </div>
  );
}

export default PrivacyPage;
