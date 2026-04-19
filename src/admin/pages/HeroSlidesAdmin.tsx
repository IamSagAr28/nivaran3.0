import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { fetchAdminHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide } from '../../utils/shopApi';
import '../styles/admin.css';

interface HeroSlide {
  id?: number;
  image: string;
  tag: string;
  title: string;
  highlight: string;
  description: string;
  primary_cta: string;
  secondary_cta: string;
  sort_order: number;
  active: boolean;
}

const emptySlide: HeroSlide = {
  image: '',
  tag: '',
  title: '',
  highlight: '',
  description: '',
  primary_cta: 'Shop Now',
  secondary_cta: 'Learn More',
  sort_order: 0,
  active: true,
};

export function HeroSlidesAdmin({ onLogout }: { onLogout: () => void }) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [form, setForm] = useState<HeroSlide>({ ...emptySlide });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSlides = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminHeroSlides();
      setSlides(data.slides || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();
  }, []);

  const startEdit = (slide: HeroSlide) => {
    setEditingId(slide.id || null);
    setForm({
      image: slide.image || '',
      tag: slide.tag || '',
      title: slide.title || '',
      highlight: slide.highlight || '',
      description: slide.description || '',
      primary_cta: slide.primary_cta || 'Shop Now',
      secondary_cta: slide.secondary_cta || 'Learn More',
      sort_order: Number(slide.sort_order || 0),
      active: !!slide.active,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptySlide });
  };

  const handleSave = async () => {
    if (!form.image.trim()) {
      alert('Image URL is required');
      return;
    }

    const payload = {
      ...form,
      sort_order: Number(form.sort_order || 0),
      active: !!form.active,
    };

    if (editingId) {
      await updateHeroSlide(editingId, payload as any);
    } else {
      await createHeroSlide(payload as any);
    }

    await loadSlides();
    resetForm();
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm('Delete this slide?')) return;
    await deleteHeroSlide(id);
    await loadSlides();
  };

  return (
    <AdminLayout onLogout={onLogout} currentPage="hero-slides">
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Hero Slideshow</h1>
          <p>Manage the homepage slideshow images and text.</p>
        </div>

        <div className="admin-form-container">
          <h3 style={{ marginBottom: 12 }}>{editingId ? 'Edit Slide' : 'Add New Slide'}</h3>
          <div className="form-row">
            <div className="form-group full-width">
              <label>Image URL *</label>
              <input
                type="text"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="/images/hero/hero1.jpg or https://..."
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tag</label>
              <input
                type="text"
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || '0', 10) })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Highlight</label>
              <input
                type="text"
                value={form.highlight}
                onChange={(e) => setForm({ ...form, highlight: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full-width">
              <label>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Primary CTA</label>
              <input
                type="text"
                value={form.primary_cta}
                onChange={(e) => setForm({ ...form, primary_cta: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Secondary CTA</label>
              <input
                type="text"
                value={form.secondary_cta}
                onChange={(e) => setForm({ ...form, secondary_cta: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  style={{ marginRight: 8 }}
                />
                Active
              </label>
            </div>
          </div>
          <div className="form-actions" style={{ display: 'flex', gap: 12 }}>
            <button className="admin-btn primary" onClick={handleSave}>
              {editingId ? 'Save Changes' : 'Add Slide'}
            </button>
            {editingId && (
              <button className="admin-btn secondary" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Title</th>
                <th>Tag</th>
                <th>Order</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}>Loading...</td></tr>
              ) : slides.length === 0 ? (
                <tr><td colSpan={6}>No slides found.</td></tr>
              ) : (
                slides.map((slide) => (
                  <tr key={slide.id}>
                    <td>
                      <img src={slide.image} alt={slide.title} style={{ width: 80, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                    </td>
                    <td>{slide.title || '-'}</td>
                    <td>{slide.tag || '-'}</td>
                    <td>{slide.sort_order || 0}</td>
                    <td>{slide.active ? 'Yes' : 'No'}</td>
                    <td>
                      <div className="product-actions">
                        <button className="action-btn edit" onClick={() => startEdit(slide)}>Edit</button>
                        <button className="action-btn delete" onClick={() => handleDelete(slide.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default HeroSlidesAdmin;
