import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { apiUrl } from '../../utils/shopApi';
import '../styles/admin.css';

interface AnalyticsAdminProps {
  onLogout: () => void;
}

export function AnalyticsAdmin({ onLogout }: AnalyticsAdminProps) {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/admin/analytics'), {
        credentials: 'include',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout onLogout={onLogout} currentPage="analytics">
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Analytics & Reports</h1>
          <p>View detailed analytics about your store performance</p>
        </div>

        {loading ? (
          <div className="admin-loading">Loading analytics...</div>
        ) : (
          <div className="admin-alert alert-info">
            <strong>📊 Analytics Module:</strong> Detailed analytics, charts, and reports coming soon!
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AnalyticsAdmin;
