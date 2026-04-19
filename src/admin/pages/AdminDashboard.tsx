import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import StatsCard from '../components/StatsCard';
import { AdminStats } from '../../types/admin';
import { apiUrl } from '../../utils/shopApi';
import '../styles/admin.css';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/admin/stats'), {
        credentials: 'include',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalProducts: data.products || 0,
          totalOrders: data.orders || 0,
          totalUsers: data.users || 0,
          totalRevenue: data.revenue || 0,
          pendingOrders: data.pending || 0,
          lowStockProducts: data.lowStock || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout onLogout={onLogout} currentPage="dashboard">
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your store overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          <StatsCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<Package size={24} />}
            color="bg-blue-500"
            loading={loading}
          />
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCart size={24} />}
            color="bg-green-500"
            loading={loading}
          />
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users size={24} />}
            color="bg-purple-500"
            loading={loading}
          />
          <StatsCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={<TrendingUp size={24} />}
            color="bg-yellow-500"
            loading={loading}
          />
        </div>

        {/* Alert Section */}
        {stats.pendingOrders > 0 && (
          <div className="admin-alert alert-warning">
            <strong>⚠️ Attention:</strong> You have {stats.pendingOrders} pending
            orders that need processing.
          </div>
        )}

        {stats.lowStockProducts > 0 && (
          <div className="admin-alert alert-info">
            <strong>📦 Low Stock:</strong> {stats.lowStockProducts} products are
            running low on inventory.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
