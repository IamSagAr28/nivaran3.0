import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { AdminProduct } from '../../types/admin';
import '../styles/admin.css';

interface ProductTableProps {
  products: AdminProduct[];
  onEdit: (product: AdminProduct) => void;
  onDelete: (id: number) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
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

            return (
              <tr key={product.id}>
                <td className="product-image-cell">
                  {images.length > 0 ? (
                    typeof images[0] === 'string' && (images[0].startsWith('data:video') || images[0].includes('.mp4')) ? (
                      <video src={images[0]} className="product-thumbnail" muted playsInline />
                    ) : (
                      <img
                        src={images[0]}
                        alt={product.title}
                        className="product-thumbnail"
                      />
                    )
                  ) : (
                    <div className="product-no-image">No image</div>
                  )}
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
