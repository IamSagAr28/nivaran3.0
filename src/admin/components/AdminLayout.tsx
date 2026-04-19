import React, { useState, useEffect } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import '../styles/admin.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  currentPage: string;
}

export function AdminLayout({ children, onLogout, currentPage }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '/admin-login';
    }
  }, []);

  return (
    <div className="admin-container">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        currentPage={currentPage}
      />

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Navigation */}
        <div className="admin-topbar">
          <button
            className="admin-menu-toggle"
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileMenuOpen(!mobileMenuOpen);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="admin-topbar-right">
            <span className="admin-user-welcome">Welcome, Admin</span>
            <button
              className="admin-logout-btn"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
