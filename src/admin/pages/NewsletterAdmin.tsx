import React, { useEffect, useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import '../styles/admin.css';

type SubscriberRow = {
  id: number;
  email: string;
  status: 'subscribed' | 'unsubscribed' | string;
  source?: string | null;
  created_at?: string;
  updated_at?: string;
  unsubscribed_at?: string | null;
};

export default function NewsletterAdmin({ onLogout }: { onLogout: () => void }) {
  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'subscribed' | 'unsubscribed'>('all');
  const [error, setError] = useState<string | null>(null);

  const [discountCode, setDiscountCode] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      setSettingsMsg(null);
      const res = await fetch('/api/newsletter/admin/settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to fetch settings');
      }
      const data = await res.json();
      setDiscountCode((data?.newsletterDiscountCode || '').toString());
    } catch (e: any) {
      setSettingsMsg(e?.message || 'Failed to fetch settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async (nextCode: string) => {
    try {
      setSettingsSaving(true);
      setSettingsMsg(null);
      const res = await fetch('/api/newsletter/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ newsletterDiscountCode: nextCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to save settings');
      setDiscountCode((data?.newsletterDiscountCode || '').toString());
      setSettingsMsg(nextCode.trim() ? 'Discount code saved.' : 'Discount code cleared.');
    } catch (e: any) {
      setSettingsMsg(e?.message || 'Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (status !== 'all') params.set('status', status);

      const res = await fetch(`/api/newsletter/admin/subscribers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to fetch subscribers');
      }

      const data = await res.json();
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch subscribers');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== 'all' && (r.status || '').toLowerCase() !== status) return false;
      if (!q) return true;
      return (r.email || '').toLowerCase().includes(q);
    });
  }, [rows, search, status]);

  const downloadCsv = () => {
    window.open('/api/newsletter/admin/export.csv', '_blank');
  };

  return (
    <AdminLayout onLogout={onLogout} currentPage="newsletter">
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Newsletter</h1>
          <p>Total Subscribers: {filtered.length}</p>
        </div>

        <div className="admin-form-container" style={{ padding: 20, marginBottom: 20 }}>
          <div className="form-section" style={{ paddingBottom: 0, borderBottom: 'none' }}>
            <h3>Settings</h3>

            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Newsletter discount code</label>
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder={settingsLoading ? 'Loading...' : 'e.g. NIVARAN10'}
                  disabled={settingsLoading || settingsSaving}
                />
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  Shown to users right after subscribing (optional).
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="admin-btn primary"
                onClick={() => saveSettings(discountCode)}
                disabled={settingsLoading || settingsSaving}
              >
                {settingsSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => saveSettings('')}
                disabled={settingsLoading || settingsSaving}
              >
                Clear
              </button>
              <button
                type="button"
                className="admin-btn secondary"
                onClick={fetchSettings}
                disabled={settingsLoading || settingsSaving}
              >
                Refresh
              </button>
            </div>

            {settingsMsg && (
              <div className="admin-alert alert-warning" style={{ marginTop: 12, marginBottom: 0 }}>
                {settingsMsg}
              </div>
            )}
          </div>
        </div>

        <div className="admin-filters">
          <div className="admin-search-bar" style={{ marginBottom: 0 }}>
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="admin-filter-select">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              aria-label="Filter by status"
            >
              <option value="all">All</option>
              <option value="subscribed">Subscribed</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>

          <button type="button" className="admin-btn secondary" onClick={fetchSubscribers}>
            Refresh
          </button>

          <button type="button" className="admin-btn primary" onClick={downloadCsv}>
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {error && (
          <div className="admin-alert alert-warning" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="admin-loading">Loading subscribers...</div>
        ) : (
          <div className="admin-table-wrapper" style={{ marginTop: 16 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Joined</th>
                  <th>Unsubscribed</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No subscribers found.</td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id}>
                      <td>{r.email}</td>
                      <td>{(r.status || '').toLowerCase() === 'subscribed' ? 'Subscribed' : 'Unsubscribed'}</td>
                      <td>{r.source || '-'}</td>
                      <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                      <td>{r.unsubscribed_at ? new Date(r.unsubscribed_at).toLocaleDateString() : '-'}</td>
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
