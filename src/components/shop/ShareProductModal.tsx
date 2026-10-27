import React, { useState } from 'react';
import { 
  Share2, Copy, Check, X, MessageCircle, Mail, 
  ExternalLink, QrCode, ShoppingBag, Zap, Sparkles 
} from 'lucide-react';

export interface ShareProduct {
  id: string | number;
  title: string;
  price: number;
  image?: string;
  category?: string;
  custom_slug?: string;
}

interface ShareProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ShareProduct;
}

export function getProductShareUrl(productId: string | number, directBuy: boolean = false): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.nivaranupcyclers.com';
  let url = `${origin}/product/${productId}`;
  if (directBuy) {
    url += '?buy=1';
  }
  return url;
}

export default function ShareProductModal({ isOpen, onClose, product }: ShareProductModalProps) {
  const [directBuy, setDirectBuy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const shareUrl = getProductShareUrl(product.id, directBuy);
  const priceFormatted = `₹${Number(product.price || 0).toFixed(0)}`;

  const shareMessage = directBuy
    ? `🌿 Buy "${product.title}" (${priceFormatted}) directly from Nivaran Upcyclers:\n${shareUrl}`
    : `🌿 Check out "${product.title}" (${priceFormatted}) handcrafted by Nivaran Upcyclers:\n${shareUrl}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on Nivaran Upcyclers (${priceFormatted})`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out "${product.title}" by @NivaranUpcyclers`)}&url=${encodeURIComponent(shareUrl)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`Recommended: ${product.title} on Nivaran Upcyclers`)}&body=${encodeURIComponent(shareMessage)}`;

  // High-res QR code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}&color=2A2A2A&bgcolor=FFFFFF&margin=2`;

  return (
    <div 
      className="share-modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="share-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#FFF8E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#B78103'
            }}>
              <Share2 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                Share This Product
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                Send to potential customers to let them buy directly
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Product Snippet Preview */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            marginBottom: '18px'
          }}>
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.title} 
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '1px solid #e5e7eb'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '8px',
                backgroundColor: '#edf2f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#718096'
              }}>
                <ShoppingBag size={24} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              {product.category && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#92400e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {product.category}
                </span>
              )}
              <h4 style={{
                margin: '2px 0 4px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {product.title}
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                  {priceFormatted}
                </span>
                <span style={{
                  fontSize: '11px',
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: '600'
                }}>
                  Verified Authentic
                </span>
              </div>
            </div>
          </div>

          {/* Direct Buy Toggle (Amazon / Quick Commerce style) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            backgroundColor: directBuy ? '#FFFBEB' : '#f8fafc',
            border: directBuy ? '1px solid #FCD34D' : '1px solid #e2e8f0',
            borderRadius: '12px',
            marginBottom: '18px',
            transition: 'all 0.2s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: directBuy ? '#F59E0B' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                transition: 'all 0.2s'
              }}>
                <Zap size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                  Direct Buy Link
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Takes buyer straight to checkout with this product in cart
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={directBuy}
              onClick={() => setDirectBuy(!directBuy)}
              style={{
                width: '46px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: directBuy ? '#10B981' : '#cbd5e1',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                padding: '2px'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transform: directBuy ? 'translateX(22px)' : 'translateX(0px)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }} />
            </button>
          </div>

          {/* Share Link Box & Copy Button */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Product Link
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f3f4f6',
              borderRadius: '10px',
              border: '1px solid #d1d5db',
              overflow: 'hidden'
            }}>
              <input 
                type="text"
                readOnly
                value={shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#374151',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  backgroundColor: copied ? '#10B981' : '#F8D548',
                  color: copied ? '#ffffff' : '#2A2A2A',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {copied ? (
                  <>
                    <Check size={16} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '10px'
            }}>
              Share via
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px'
            }}>
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 6px',
                  borderRadius: '12px',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  textDecoration: 'none',
                  transition: 'transform 0.15s, opacity 0.15s',
                  gap: '6px'
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <MessageCircle size={22} />
                <span style={{ fontSize: '11px', fontWeight: '600' }}>WhatsApp</span>
              </a>

              {/* Twitter / X */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 6px',
                  borderRadius: '12px',
                  backgroundColor: '#111827',
                  color: '#ffffff',
                  textDecoration: 'none',
                  transition: 'transform 0.15s, opacity 0.15s',
                  gap: '6px'
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <span style={{ fontSize: '16px', fontWeight: '900', lineHeight: 1 }}>𝕏</span>
                <span style={{ fontSize: '11px', fontWeight: '600' }}>X (Twitter)</span>
              </a>

              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 6px',
                  borderRadius: '12px',
                  backgroundColor: '#1877F2',
                  color: '#ffffff',
                  textDecoration: 'none',
                  transition: 'transform 0.15s, opacity 0.15s',
                  gap: '6px'
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <span style={{ fontSize: '18px', fontWeight: '900', lineHeight: 1 }}>f</span>
                <span style={{ fontSize: '11px', fontWeight: '600' }}>Facebook</span>
              </a>

              {/* Email */}
              <a
                href={emailUrl}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 6px',
                  borderRadius: '12px',
                  backgroundColor: '#EA4335',
                  color: '#ffffff',
                  textDecoration: 'none',
                  transition: 'transform 0.15s, opacity 0.15s',
                  gap: '6px'
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Mail size={20} />
                <span style={{ fontSize: '11px', fontWeight: '600' }}>Email</span>
              </a>
            </div>
          </div>

          {/* Extra options: Native Share (mobile) & QR Code */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid #f0f0f0'
          }}>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4b5563',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: '4px 0'
                }}
              >
                <Share2 size={14} /> More options...
              </button>
            )}

            <button
              onClick={() => setShowQr(!showQr)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: showQr ? '#B78103' : '#4b5563',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              <QrCode size={14} /> {showQr ? 'Hide QR Code' : 'Show QR Code'}
            </button>
          </div>

          {/* QR Code expansion */}
          {showQr && (
            <div style={{
              marginTop: '14px',
              padding: '16px',
              backgroundColor: '#fafafa',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#666' }}>
                Scan with phone camera to open product page directly:
              </p>
              <div style={{
                display: 'inline-block',
                padding: '8px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  style={{ width: '160px', height: '160px', display: 'block' }} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
