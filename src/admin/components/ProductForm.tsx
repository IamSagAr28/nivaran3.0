import React, { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { AdminProduct } from '../../types/admin';
import '../styles/admin.css';

interface ProductFormProps {
  product?: AdminProduct | null;
  onSave: (data: Partial<AdminProduct>) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<AdminProduct>>({
    title: '',
    description: '',
    price: 0,
    compare_at_price: 0,
    category: '',
    colors: '[]',
    material: '',
    stock: 0,
    featured: false,
    images: '[]',
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      const productObj = { ...product };
      let imagesArray: string[] = [];
      if (typeof product.images === 'string') {
        try {
          imagesArray = JSON.parse(product.images);
        } catch {
          imagesArray = [];
        }
      } else if (Array.isArray(product.images)) {
        imagesArray = product.images;
        productObj.images = JSON.stringify(product.images);
      }
      setFormData(productObj);
      setImagePreviews(imagesArray);
    }
  }, [product]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: string[] = [...imagePreviews];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          newPreviews.push(result);
          if (i === files.length - 1) {
            setImagePreviews(newPreviews.slice(0, 5));
            setFormData({
              ...formData,
              images: JSON.stringify(newPreviews.slice(0, 5)),
            });
          }
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    const updated = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(updated);
    setFormData({
      ...formData,
      images: JSON.stringify(updated),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-form-container">
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group full-width">
              <label>Product Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter product title"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Pricing & Inventory</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price || 0}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Compare at Price (₹)</label>
              <input
                type="number"
                name="compare_at_price"
                value={formData.compare_at_price || 0}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock || 0}
                onChange={handleInputChange}
                required
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Product Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                required
                placeholder="e.g., Electronics, Clothing"
              />
            </div>
            <div className="form-group">
              <label>Material</label>
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={handleInputChange}
                placeholder="e.g., Cotton, Plastic"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Colors (comma-separated)</label>
              <input
                type="text"
                name="colors"
                value={
                  Array.isArray(formData.colors)
                    ? formData.colors.join(', ')
                    : formData.colors && typeof formData.colors === 'string'
                    ? (() => {
                        try {
                          return JSON.parse(formData.colors).join(', ');
                        } catch {
                          return formData.colors;
                        }
                      })()
                    : ''
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    colors: JSON.stringify(e.target.value.split(',').map(c => c.trim())),
                  })
                }
                placeholder="e.g., Red, Blue, Green"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured || false}
                  onChange={handleInputChange}
                />
                Featured Product
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Product Images & Videos</h3>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>Upload up to 5 images or videos (MP4)</p>
          <div className="form-upload">
            <label className={`upload-label ${imagePreviews.length >= 5 ? 'disabled' : ''}`}>
              <Upload size={24} />
              <span>Click to upload media</span>
              <input
                type="file"
                multiple
                accept="image/*,video/mp4"
                onChange={handleImageUpload}
                disabled={imagePreviews.length >= 5}
                hidden
              />
            </label>
          </div>

          {imagePreviews.length > 0 && (
            <div className="image-previews">
              {imagePreviews.map((media, idx) => (
                <div key={idx} className="image-preview">
                  {typeof media === 'string' && (media.startsWith('data:video') || media.includes('.mp4')) ? (
                    <video src={media} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={media} alt={`Preview ${idx}`} />
                  )}
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeImage(idx)}
                  >
                    <X size={16} />
                  </button>
                  <div className="preview-number">{idx === 0 ? 'Main' : idx + 1}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="admin-btn secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-btn primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
