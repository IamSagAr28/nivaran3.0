import React, { useState } from 'react';
import { Edit2, Trash2, Share2, Check } from 'lucide-react';
import { AdminProduct } from '../../types/admin';
import { apiUrl } from '../../utils/shopApi';
import '../styles/admin.css';

function ProductThumbnail({ product }: { product: AdminProduct }) {
  const [failed, setFailed] = useState(false);

  let images: string[] = [];
  if (typeof product.images === 'string') {
    try {
      images = JSON.parse(product.images);
    } catch {
      images = [];
    }
  } else if (Array.isArray(product.images)) {
    images = product.images;
  }

  if (failed) {
    return <div className="product-no-image">No image</div>;
  }

  const src = images.length > 0 ? images[0] : apiUrl(`/api/products/${product.id}/media/0`);

  return typeof src === 'string' && (src.startsWith('data:video') || src.includes('.mp4')) ? (
    <video src={src} className="product-thumbnail" muted playsInline />
  ) : (
    <img
      src={src}
      alt={product.title}
      className="product-thumbnail"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

interface ProductTableProps {
  products: AdminProduct[];
  onEdit: (product: AdminProduct) => void;
  onDelete: (id: number) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopyShareLink = (product: AdminProduct) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.nivaranupcyclers.com';
    const link = `${origin}/product/${product.id}?buy=1`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedId(product.id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  if (products.length === 0) {
    return (
      <div className="admin-empty-state">
        <p>No products found. Create your first product to get started!</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Product Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Featured</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            return (
              <tr key={product.id}>
                <td className="product-image-cell">
                  <ProductThumbnail product={product} />
                </td>
                <td className="product-name">{product.title}</td>
                <td>{product.category}</td>
                <td className="product-price">₹{product.price.toFixed(2)}</td>
                <td>
                  <span
                    className={`stock-badge ${
                      product.stock > 10
                        ? 'in-stock'
                        : product.stock > 0
                        ? 'low-stock'
                        : 'out-of-stock'
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td>{product.featured ? '⭐ Yes' : 'No'}</td>
                <td className="product-actions">
                  <button
                    className="action-btn share"
                    onClick={() => handleCopyShareLink(product)}
                    title={copiedId === product.id ? "Direct Buy Link Copied!" : "Copy Direct Buy Link to share"}
                    style={{
                      color: copiedId === product.id ? '#10B981' : undefined,
                      borderColor: copiedId === product.id ? '#10B981' : undefined
                    }}
                  >
                    {copiedId === product.id ? <Check size={16} /> : <Share2 size={16} />}
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => onEdit(product)}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => onDelete(product.id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ProductTable;
