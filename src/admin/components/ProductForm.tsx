import React, { useState, useEffect } from 'react';
import { Upload, X, Plus, Trash2 } from 'lucide-react';
import { AdminProduct, Variant, VariantType } from '../../types/admin';
import '../styles/admin.css';

const MAX_MEDIA_ITEMS = 5;
const MAX_VIDEO_BYTES = 5 * 1024 * 1024; // 5MB per MP4 (base64 gets bigger)
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB input file cap
const IMAGE_MAX_DIM = 1600; // resize longest side
const IMAGE_JPEG_QUALITY = 0.82;

function bytesToMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

async function compressImageToDataUrl(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Invalid image'));
    img.src = dataUrl;
  });

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height) return dataUrl;

  const scale = Math.min(1, IMAGE_MAX_DIM / Math.max(width, height));
  const outW = Math.max(1, Math.round(width * scale));
  const outH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, outW, outH);

  // Convert to JPEG to shrink payload; this is the main protection against request-size failures.
  return canvas.toDataURL('image/jpeg', IMAGE_JPEG_QUALITY);
}

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
    variants: '[]',
    variant_types: '[]',
    material: '',
    stock: 0,
    featured: false,
    images: '[]',
  });

  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});
  
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [newVariants, setNewVariants] = useState<Variant[]>([]);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

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

      let colorsArray: string[] = [];
      if (typeof product.colors === 'string') {
        try {
          colorsArray = JSON.parse(product.colors);
        } catch {
          colorsArray = [];
        }
      } else if (Array.isArray(product.colors)) {
        colorsArray = product.colors;
        productObj.colors = JSON.stringify(product.colors);
      }

      let variantsArray: Array<{ color: string; stock: number }> = [];
      if (typeof (product as any).variants === 'string') {
        try {
          variantsArray = JSON.parse((product as any).variants);
        } catch {
          variantsArray = [];
        }
      } else if (Array.isArray((product as any).variants)) {
        variantsArray = (product as any).variants;
        (productObj as any).variants = JSON.stringify((product as any).variants);
      }

      const stockMap: Record<string, number> = {};
      if (variantsArray.length) {
        for (const v of variantsArray) {
          if (v?.color) stockMap[String(v.color)] = Number(v.stock || 0);
        }
      } else if (colorsArray.length) {
        // Back-compat: older products may have colors + total stock, but no variants yet.
        // Preserve the current total stock by putting it into the first color.
        for (const c of colorsArray) stockMap[String(c)] = 0;
        const existingTotal = Number((product as any).stock ?? 0);
        if (colorsArray[0]) stockMap[String(colorsArray[0])] = Number.isFinite(existingTotal) ? Math.max(0, existingTotal) : 0;
        (productObj as any).variants = JSON.stringify(colorsArray.map(c => ({ color: c, stock: Number(stockMap[String(c)] || 0) })));
      }

      const totalVariantStock = Object.values(stockMap).reduce((sum, n) => sum + Math.max(0, Number(n || 0)), 0);
      if (colorsArray.length) {
        productObj.stock = totalVariantStock;
      }
      
      let vTypes: VariantType[] = [];
      let varts: Variant[] = [];
      try { vTypes = JSON.parse((product as any).variant_types || '[]'); } catch {}
      try { varts = JSON.parse((product as any).variants || '[]'); } catch {}
      setVariantTypes(vTypes);
      setNewVariants(varts);

      setFormData(productObj);
      setImagePreviews(imagesArray);
      setVariantStocks(stockMap);
    }
  }, [product]);

  const getColorsArray = () => {
    if (Array.isArray(formData.colors)) return formData.colors.map(String);
    if (typeof formData.colors === 'string') {
      try {
        const parsed = JSON.parse(formData.colors);
        return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
      } catch {
        return formData.colors.split(',').map(c => c.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const syncVariantsToForm = (colorsArray: string[], nextStocks: Record<string, number>) => {
    const variants = colorsArray.map(c => ({
      color: c,
      stock: Math.max(0, Number(nextStocks[c] ?? 0)),
    }));
    const total = variants.reduce((sum, v) => sum + (Number.isFinite(v.stock) ? v.stock : 0), 0);
    setFormData(prev => ({
      ...prev,
      colors: JSON.stringify(colorsArray),
      variants: JSON.stringify(variants),
      stock: total,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleColorsChange = (raw: string) => {
    const colorsArray = raw.split(',').map(c => c.trim()).filter(Boolean);
    const nextStocks: Record<string, number> = {};
    for (const c of colorsArray) {
      nextStocks[c] = variantStocks[c] ?? 0;
    }
    setVariantStocks(nextStocks);
    if (colorsArray.length) {
      syncVariantsToForm(colorsArray, nextStocks);
    } else {
      setFormData(prev => ({ ...prev, colors: '[]', variants: '[]' }));
    }
  };

  const updateVariantStock = (color: string, stock: number) => {
    const colorsArray = getColorsArray();
    const nextStocks = { ...variantStocks, [color]: Math.max(0, Number(stock || 0)) };
    setVariantStocks(nextStocks);
    if (colorsArray.length) {
      syncVariantsToForm(colorsArray, nextStocks);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadError('');
    setUploading(true);

    try {
      const remaining = Math.max(0, MAX_MEDIA_ITEMS - imagePreviews.length);
      const selected = Array.from(files).slice(0, remaining);

      const processed: string[] = [];
      for (const file of selected) {
        const isVideo = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
        const isImage = file.type.startsWith('image/');

        if (!isImage && !isVideo) {
          throw new Error('Only images and MP4 videos are supported');
        }

        if (isVideo && file.size > MAX_VIDEO_BYTES) {
          throw new Error(`MP4 is too large (${bytesToMb(file.size)}MB). Please upload a smaller video (max ${bytesToMb(MAX_VIDEO_BYTES)}MB).`);
        }
        if (isImage && file.size > MAX_IMAGE_BYTES) {
          throw new Error(`Image is too large (${bytesToMb(file.size)}MB). Please upload a smaller image (max ${bytesToMb(MAX_IMAGE_BYTES)}MB).`);
        }

        if (isImage) {
          processed.push(await compressImageToDataUrl(file));
        } else {
          processed.push(await fileToDataUrl(file));
        }
      }

      const next = [...imagePreviews, ...processed].slice(0, MAX_MEDIA_ITEMS);
      setImagePreviews(next);
      setFormData((prev) => ({
        ...prev,
        images: JSON.stringify(next),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(message);
    } finally {
      setUploading(false);
      // allow selecting the same file again
      e.target.value = '';
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

  const handleVariantTypeChange = (index: number, name: string) => {
    const updated = [...variantTypes];
    updated[index] = { ...updated[index], name };
    setVariantTypes(updated);
  };

  const addVariantType = () => {
    setVariantTypes([...variantTypes, { name: '', options: [] }]);
  };

  const removeVariantType = (index: number) => {
    setVariantTypes(variantTypes.filter((_, i) => i !== index));
  };

  const generateVariantCombinations = () => {
    const vTypes = variantTypes.filter(vt => vt.name && vt.options.length > 0);
    if (vTypes.length === 0) {
      setNewVariants([]);
      return;
    }

    const combinations = vTypes.reduce((acc, vt) => {
      if (acc.length === 0) {
        return vt.options.map(opt => ({ [vt.name]: opt }));
      }
      return acc.flatMap(combo => 
        vt.options.map(opt => ({ ...combo, [vt.name]: opt }))
      );
    }, [] as Array<Record<string, string>>);

    const updatedVariants = combinations.map(attributes => {
      const existing = newVariants.find(v => 
        Object.keys(attributes).every(key => attributes[key] === v.attributes[key]) &&
        Object.keys(v.attributes).every(key => attributes[key] === v.attributes[key])
      );
      return {
        attributes,
        price: existing?.price ?? formData.price ?? 0,
        stock: existing?.stock ?? 0,
      };
    });
    setNewVariants(updatedVariants);
  };

  const handleVariantDetailChange = (index: number, field: 'price' | 'stock', value: number) => {
    const updated = [...newVariants];
    updated[index][field] = value;
    setNewVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) {
      setUploadError('Please wait for uploads to finish before saving.');
      return;
    }
    setSaving(true);
    try {
      const totalStock = newVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      const finalFormData = {
        ...formData,
        variant_types: JSON.stringify(variantTypes),
        variants: JSON.stringify(newVariants),
        stock: newVariants.length > 0 ? totalStock : formData.stock,
      };
      await onSave(finalFormData);
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
          {getColorsArray().length > 0 && (
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
              Per-color stock is enabled. Total stock is calculated automatically.
            </p>
          )}
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
                required={getColorsArray().length === 0}
                min="0"
                disabled={getColorsArray().length > 0}
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

          <div className="form-section" style={{ marginTop: '20px' }}>
            <h3>Advanced Variants (Optional)</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>Define complex options like multiple Sizes and Colors.</p>
            {variantTypes.map((vt, typeIndex) => (
              <div key={typeIndex} className="variant-type-section" style={{ marginBottom: '10px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Variant Type</label>
                    <input
                      type="text"
                      placeholder="e.g., Color, Size"
                      value={vt.name}
                      onChange={(e) => handleVariantTypeChange(typeIndex, e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Options (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g., Red, Green, Blue"
                      value={vt.options.join(', ')}
                      onChange={(e) => {
                        const updated = [...variantTypes];
                        updated[typeIndex].options = e.target.value.split(',').map(s => s.trim());
                        setVariantTypes(updated);
                      }}
                    />
                  </div>
                  <button type="button" onClick={() => removeVariantType(typeIndex)} className="admin-btn danger-outline small" style={{alignSelf:"flex-end", marginBottom:"5px"}}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <div className="form-row" style={{marginBottom: "20px"}}>
              <button type="button" onClick={addVariantType} className="admin-btn secondary" style={{marginRight:"10px"}}>
                <Plus size={16} /> Add Variant Type
              </button>
              <button type="button" onClick={generateVariantCombinations} className="admin-btn primary">
                Generate Combinations
              </button>
            </div>

            {newVariants.length > 0 && (
              <div className="variants-table" style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr>
                      {variantTypes.map(vt => vt.name && <th key={vt.name} style={{borderBottom:"1px solid #ddd", padding:"8px", textAlign:"left"}}>{vt.name}</th>)}
                      <th style={{borderBottom:"1px solid #ddd", padding:"8px", textAlign:"left"}}>Price</th>
                      <th style={{borderBottom:"1px solid #ddd", padding:"8px", textAlign:"left"}}>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newVariants.map((variant, index) => (
                      <tr key={index}>
                        {variantTypes.map(vt => vt.name && <td key={vt.name} style={{padding:"8px"}}>{variant.attributes[vt.name]}</td>)}
                        <td style={{padding:"8px"}}>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleVariantDetailChange(index, 'price', parseFloat(e.target.value))}
                            style={{width:"80px"}}
                          />
                        </td>
                        <td style={{padding:"8px"}}>
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => handleVariantDetailChange(index, 'stock', parseInt(e.target.value))}
                            style={{width:"60px"}}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Legacy Colors (comma-separated)</label>
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
                onChange={(e) => handleColorsChange(e.target.value)}
                placeholder="e.g., Red, Blue, Green"
              />
            </div>
          </div>

          {getColorsArray().length > 0 && (
            <div className="form-row">
              {getColorsArray().map((color) => (
                <div key={color} className="form-group">
                  <label>Stock for {color}</label>
                  <input
                    type="number"
                    min="0"
                    value={variantStocks[color] ?? 0}
                    onChange={(e) => updateVariantStock(color, parseInt(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          )}

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
          {uploadError && (
            <div style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '10px' }}>
              {uploadError}
            </div>
          )}
          <div className="form-upload">
            <label className={`upload-label ${imagePreviews.length >= 5 ? 'disabled' : ''}`}>
              <Upload size={24} />
              <span>{uploading ? 'Processing...' : 'Click to upload media'}</span>
              <input
                type="file"
                multiple
                accept="image/*,video/mp4"
                onChange={handleImageUpload}
                disabled={imagePreviews.length >= 5 || uploading || saving}
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
            disabled={saving || uploading}
          >
            {saving ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
