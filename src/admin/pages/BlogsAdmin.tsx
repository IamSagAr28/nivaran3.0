import React, { useEffect, useMemo, useState } from 'react';
import { 
  Search, Plus, Trash2, Edit2, Save, X, Upload, Globe, 
  Heading1, Heading2, Heading3, Bold, Italic, List, ListOrdered, 
  Quote, Eye, EyeOff, Sparkles, Check, ExternalLink 
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { apiUrl } from '../../utils/shopApi';
import { formatBlogContent } from '../../utils/blogFormatter';

type BlogRow = {
  id: number;
  title: string;
  handle: string;
  image_url?: string | null;
  image_alt?: string | null;
  current_author?: string | null;
  excerpt?: string | null;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB input file cap
const IMAGE_MAX_DIM = 1600; // resize longest side
const IMAGE_JPEG_QUALITY = 0.82;

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

  return canvas.toDataURL('image/jpeg', IMAGE_JPEG_QUALITY);
}

export default function BlogsAdmin({ onLogout }: { onLogout: () => void }) {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [form, setForm] = useState({
    title: '',
    handle: '',
    image_url: '',
    image_alt: '',
    current_author: 'Nivaran',
    excerpt: '',
    content: '',
    meta_title: '',
    meta_description: '',
    canonical_url: '',
  });

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl('/api/blogs/admin'), {
        credentials: 'include',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
      });
      if (!res.ok) throw new Error('Failed to load blogs');
      const data = await res.json();
      setBlogs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load blogs');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return blogs;
    return blogs.filter((b) =>
      (b.title || '').toLowerCase().includes(q) || (b.handle || '').toLowerCase().includes(q)
    );
  }, [blogs, search]);

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setPreviewMode(false);
    setForm({
      title: '',
      handle: '',
      image_url: '',
      image_alt: '',
      current_author: 'Nivaran',
      excerpt: '',
      content: '',
      meta_title: '',
      meta_description: '',
      canonical_url: '',
    });
  };

  const startEdit = (blog: BlogRow) => {
    setIsCreating(false);
    setEditingId(blog.id);
    setPreviewMode(false);
    setForm({
      title: blog.title || '',
      handle: blog.handle || '',
      image_url: blog.image_url || '',
      image_alt: blog.image_alt || '',
      current_author: blog.current_author || 'Nivaran',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      meta_title: blog.meta_title || '',
      meta_description: blog.meta_description || '',
      canonical_url: blog.canonical_url || '',
    });
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setPreviewMode(false);
    setForm({
      title: '',
      handle: '',
      image_url: '',
      image_alt: '',
      current_author: 'Nivaran',
      excerpt: '',
      content: '',
      meta_title: '',
      meta_description: '',
      canonical_url: '',
    });
  };

  // Helper to insert markdown/HTML formatting at cursor
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = document.getElementById('blog-content-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = form.content;
    const selected = current.substring(start, end) || defaultText;

    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = current.substring(0, start) + replacement + current.substring(end);
    setForm((p) => ({ ...p, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  const saveBlog = async () => {
    try {
      setError(null);
      const title = form.title.trim();
      const content = form.content.trim();
      if (!title) throw new Error('Title is required');
      if (!content) throw new Error('Content is required');

      const handle = (form.handle || slugify(title)).trim();
      const defaultCanonical = `https://www.nivaranupcyclers.com/blogs/news/${handle}`;
      let finalCanonical = form.canonical_url.trim();
      if (!finalCanonical) {
        finalCanonical = defaultCanonical;
      } else if (!/^https?:\/\//i.test(finalCanonical)) {
        if (finalCanonical.startsWith('/')) {
          finalCanonical = `https://www.nivaranupcyclers.com${finalCanonical}`;
        } else {
          finalCanonical = `https://www.nivaranupcyclers.com/blogs/news/${finalCanonical}`;
        }
      }

      const payload = {
        ...form,
        title,
        content,
        handle,
        meta_title: form.meta_title.trim() || `${title} | Nivaran Upcyclers Blog`,
        meta_description: form.meta_description.trim() || (form.excerpt || content.replace(/<[^>]*>/g, '').slice(0, 155)),
        canonical_url: finalCanonical,
      };

      const isEdit = editingId != null;
      const url = isEdit ? `/api/blogs/admin/${editingId}` : '/api/blogs/admin';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(apiUrl(url), {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Save failed');
      }

      cancelForm();
      await loadBlogs();
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    }
  };

  const deleteBlog = async (id: number) => {
    if (!confirm('Delete this blog post?')) return;

    try {
      setError(null);
      const res = await fetch(apiUrl(`/api/blogs/admin/${id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Delete failed');
      }
      await loadBlogs();
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
    }
  };

  // Previews for SEO
  const effectiveHandle = form.handle || slugify(form.title || 'blog-handle');
  const previewMetaTitle = form.meta_title || (form.title ? `${form.title} | Nivaran Upcyclers Blog` : 'Blog Title | Nivaran Upcyclers');
  const previewMetaDesc = form.meta_description || form.excerpt || 'Discover sustainable living, recycling techniques, and eco-friendly tips from Nivaran Upcyclers.';
  const previewCanonical = form.canonical_url || `https://www.nivaranupcyclers.com/blogs/news/${effectiveHandle}`;

  return (
    <AdminLayout onLogout={onLogout} currentPage="blogs">
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Blogs Management</h1>
          <p>Total Posts: {filtered.length}</p>
        </div>

        <div className="admin-filters">
          <div className="admin-search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by title or handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="admin-btn primary"
              onClick={startCreate}
              disabled={isCreating || editingId != null}
            >
              <Plus size={16} />
              Add Blog
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-alert alert-warning" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        {(isCreating || editingId != null) && (
          <div className="admin-form-container" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#1B4332' }}>
                {editingId != null ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h3>
              {editingId && (
                <a
                  href={`/blogs/news/${form.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: '#1B4332', fontWeight: 600 }}
                >
                  <ExternalLink size={14} />
                  View Live Article
                </a>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Blog Title *</label>
                <input
                  value={form.title}
                  placeholder="e.g. Pooja Waste Disposal in Kanpur: Where and How to Do It Right"
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      title: e.target.value,
                      handle: p.handle ? p.handle : slugify(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>URL Slug (Handle) *</label>
                <input
                  value={form.handle}
                  placeholder="e.g. pooja-waste-disposal-in-kanpur"
                  onChange={(e) => setForm((p) => ({ ...p, handle: slugify(e.target.value) }))}
                />
                <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                  URL: /blogs/news/{form.handle || 'your-slug'}
                </span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Featured Image URL</label>
                <input
                  value={form.image_url && form.image_url.startsWith('data:') ? 'Embedded Image File (Base64)' : form.image_url || ''}
                  onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                  disabled={form.image_url ? form.image_url.startsWith('data:') : false}
                  placeholder="Paste image URL or upload image file below"
                />
              </div>
              <div className="form-group">
                <label>Image Alt Text</label>
                <input
                  value={form.image_alt || ''}
                  placeholder="Descriptive text for accessibility & SEO image ranking"
                  onChange={(e) => setForm((p) => ({ ...p, image_alt: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Upload Image File</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label className="admin-btn secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={16} />
                    {uploadingImage ? 'Processing...' : 'Choose File'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > MAX_IMAGE_BYTES) {
                          alert('Image is too large. Max: 8MB');
                          return;
                        }
                        try {
                          setUploadingImage(true);
                          const base64 = await compressImageToDataUrl(file);
                          setForm((p) => ({ ...p, image_url: base64 }));
                        } catch {
                          alert('Failed to process image');
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                    />
                  </label>
                  {form.image_url && (
                    <button
                      type="button"
                      className="admin-btn secondary"
                      onClick={() => setForm((p) => ({ ...p, image_url: '' }))}
                    >
                      Clear Image
                    </button>
                  )}
                </div>
                {form.image_url && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Image Preview:</p>
                    <img
                      src={form.image_url}
                      alt="Blog Preview"
                      style={{ maxWidth: 160, maxHeight: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Author</label>
                <input
                  value={form.current_author}
                  onChange={(e) => setForm((p) => ({ ...p, current_author: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Excerpt / Short Summary</label>
                <input
                  value={form.excerpt}
                  placeholder="Short 1-2 sentence overview for cards and meta preview"
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                />
              </div>
            </div>

            {/* Content Formatting Toolbar */}
            <div className="form-row full-width" style={{ marginTop: 8 }}>
              <div className="form-group full-width">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>Blog Content *</label>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n\n## ', '\n', 'Main Section Heading')}
                      className="admin-btn secondary"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="Insert H2 Heading (e.g. ## What is Pooja Waste Disposal?)"
                    >
                      <Heading2 size={14} /> <strong>H2</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n\n### ', '\n', 'Subheading Title')}
                      className="admin-btn secondary"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="Insert H3 Subheading (e.g. ### 1. Protection of Rivers)"
                    >
                      <Heading3 size={14} /> <strong>H3</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**', 'bold text')}
                      className="admin-btn secondary"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="Bold text"
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*', 'italic text')}
                      className="admin-btn secondary"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="Italic text"
                    >
                      <Italic size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n- ', '\n', 'List item')}
                      className="admin-btn secondary"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="Bullet list item"
                    >
                      <List size={14} /> List
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n1. ', '\n', 'Numbered step')}
                      className="admin-btn secondary"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="Numbered list item"
                    >
                      <ListOrdered size={14} /> Steps
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n> ', '\n', 'Inspiring quote or key takeaway')}
                      className="admin-btn secondary"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="Quote callout"
                    >
                      <Quote size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewMode(!previewMode)}
                      className={`admin-btn ${previewMode ? 'primary' : 'secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}
                    >
                      {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
                      {previewMode ? 'Back to Editor' : 'Live Preview'}
                    </button>
                  </div>
                </div>

                {previewMode ? (
                  <div
                    style={{
                      minHeight: 280,
                      padding: '24px 32px',
                      backgroundColor: '#ffffff',
                      border: '2px solid #1B4332',
                      borderRadius: 8,
                      overflowY: 'auto',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1B4332' }}>🌿 Live Formatted Preview (H1/H2/H3/Paragraphs)</span>
                      <button
                        type="button"
                        onClick={() => setPreviewMode(false)}
                        style={{ fontSize: '0.75rem', color: '#4b5563', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}
                      >
                        Return to editing
                      </button>
                    </div>

                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1B4332', marginBottom: 16 }}>
                      {form.title || 'Untitled Blog Post'}
                    </h1>

                    <div
                      dangerouslySetInnerHTML={{ __html: formatBlogContent(form.content) }}
                      style={{ fontSize: '1rem', lineHeight: 1.8, color: '#2D3748' }}
                    />
                  </div>
                ) : (
                  <>
                    <textarea
                      id="blog-content-textarea"
                      rows={14}
                      value={form.content}
                      placeholder="Write or paste your blog text here. Use ## for Section Headings, ### for Subheadings, and - for bullet points, or use the toolbar buttons above."
                      onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                      style={{ fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: 1.6 }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                      💡 Tip: Use <code>## Heading</code> for main sections (H2), <code>### Subheading</code> for subtopics (H3), and blank lines between paragraphs.
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* SEO SETTINGS SECTION */}
            <div style={{ marginTop: 24, padding: 20, backgroundColor: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Globe size={20} color="#1B4332" />
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#1B4332' }}>
                  SEO Meta Tags & Canonical Settings
                </h4>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: 12, color: '#475569' }}>
                  Search Engines & Social Sharing
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Meta Title</label>
                    <span style={{ fontSize: '0.75rem', color: form.meta_title.length > 60 ? '#dc2626' : '#6b7280' }}>
                      {form.meta_title.length}/60 characters (ideal: 50-60)
                    </span>
                  </div>
                  <input
                    value={form.meta_title}
                    placeholder={form.title ? `${form.title} | Nivaran Upcyclers Blog` : 'Enter custom meta title for Google'}
                    onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                    If empty, defaults to: <code>{previewMetaTitle}</code>
                  </span>
                </div>

                <div className="form-group">
                  <label>Canonical URL</label>
                  <input
                    value={form.canonical_url}
                    placeholder={`https://www.nivaranupcyclers.com/blogs/news/${effectiveHandle}`}
                    onChange={(e) => setForm((p) => ({ ...p, canonical_url: e.target.value }))}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                    If empty, defaults to: <code>{previewCanonical}</code>
                  </span>
                </div>
              </div>

              <div className="form-row full-width">
                <div className="form-group full-width">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Meta Description</label>
                    <span style={{ fontSize: '0.75rem', color: form.meta_description.length > 160 ? '#dc2626' : '#6b7280' }}>
                      {form.meta_description.length}/160 characters (ideal: 150-160)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={form.meta_description}
                    placeholder={form.excerpt || 'Enter descriptive summary for Google search results snippet'}
                    onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                    If empty, defaults to: <code>{previewMetaDesc.slice(0, 150)}...</code>
                  </span>
                </div>
              </div>

              {/* Real-time Google SERP Preview Card */}
              <div style={{ marginTop: 16, padding: 14, backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600 }}>
                  Google Search Snippet Preview
                </span>
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: '0.8rem', color: '#202124', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ backgroundColor: '#f1f3f4', borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🌿</span>
                    <span>nivaranupcyclers.com</span>
                    <span style={{ color: '#5f6368' }}>› blogs › news › {effectiveHandle}</span>
                  </div>
                  <div style={{ fontSize: '1.15rem', color: '#1a0dab', fontWeight: 500, lineHeight: 1.3, marginTop: 4, cursor: 'pointer', textDecoration: 'underline' }}>
                    {previewMetaTitle}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#4d5156', lineHeight: 1.45, marginTop: 4 }}>
                    {previewMetaDesc.slice(0, 160)}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button type="button" className="admin-btn primary" onClick={saveBlog}>
                <Save size={16} />
                Save & Publish
              </button>
              <button type="button" className="admin-btn secondary" onClick={cancelForm}>
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="admin-loading">Loading blogs...</div>
        ) : (
          <div className="admin-table-wrapper" style={{ marginTop: 16 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Handle</th>
                  <th>SEO Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No blog posts found.</td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id}>
                      <td className="order-id">#{b.id}</td>
                      <td style={{ fontWeight: 600 }}>
                        {b.title}
                        {b.excerpt && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'normal', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {b.excerpt}
                          </div>
                        )}
                      </td>
                      <td>
                        <a
                          href={`/blogs/news/${b.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1B4332', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          {b.handle}
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: b.meta_title ? '#ecfdf5' : '#fef3c7',
                          color: b.meta_title ? '#065f46' : '#92400e'
                        }}>
                          {b.meta_title ? <Check size={12} /> : null}
                          {b.meta_title ? 'Custom SEO' : 'Auto Default'}
                        </span>
                      </td>
                      <td>{b.updated_at ? new Date(b.updated_at).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className="product-actions">
                          <button type="button" className="action-btn edit" onClick={() => startEdit(b)}>
                            Edit
                          </button>
                          <button type="button" className="action-btn delete" onClick={() => deleteBlog(b.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
