import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { apiUrl } from '../../utils/shopApi';

type BlogRow = {
  id: number;
  title: string;
  handle: string;
  image_url?: string | null;
  image_alt?: string | null;
  current_author?: string | null;
  excerpt?: string | null;
  content: string;
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

export default function BlogsAdmin({ onLogout }: { onLogout: () => void }) {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: '',
    handle: '',
    image_url: '',
    image_alt: '',
    current_author: 'Nivaran',
    excerpt: '',
    content: '',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setForm({
      title: '',
      handle: '',
      image_url: '',
      image_alt: '',
      current_author: 'Nivaran',
      excerpt: '',
      content: '',
    });
  };

  const startEdit = (blog: BlogRow) => {
    setIsCreating(false);
    setEditingId(blog.id);
    setForm({
      title: blog.title || '',
      handle: blog.handle || '',
      image_url: blog.image_url || '',
      image_alt: blog.image_alt || '',
      current_author: blog.current_author || 'Nivaran',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
    });
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setForm({
      title: '',
      handle: '',
      image_url: '',
      image_alt: '',
      current_author: 'Nivaran',
      excerpt: '',
      content: '',
    });
  };

  const saveBlog = async () => {
    try {
      setError(null);
      const title = form.title.trim();
      const content = form.content.trim();
      if (!title) throw new Error('Title is required');
      if (!content) throw new Error('Content is required');

      const payload = {
        ...form,
        title,
        content,
        handle: (form.handle || slugify(title)).trim(),
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

  return (
    <AdminLayout onLogout={onLogout} currentPage="blogs">
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Blogs</h1>
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
            <h3 style={{ marginBottom: 12 }}>{editingId != null ? 'Edit Blog' : 'Add Blog'}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input
                  value={form.title}
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
                <label>Handle (slug)</label>
                <input
                  value={form.handle}
                  onChange={(e) => setForm((p) => ({ ...p, handle: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Image URL</label>
                <input
                  value={form.image_url}
                  onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Image Alt</label>
                <input
                  value={form.image_alt}
                  onChange={(e) => setForm((p) => ({ ...p, image_alt: e.target.value }))}
                />
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
                <label>Excerpt</label>
                <input
                  value={form.excerpt}
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row full-width">
              <div className="form-group full-width">
                <label>Content *</label>
                <textarea
                  rows={10}
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="admin-btn primary" onClick={saveBlog}>
                <Save size={16} />
                Save
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
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No blog posts found.</td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id}>
                      <td className="order-id">#{b.id}</td>
                      <td>{b.title}</td>
                      <td>{b.handle}</td>
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
