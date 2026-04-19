import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  ChevronRight,
  Image,
  Ticket,
  FileText,
  Mail,
} from 'lucide-react';
import { useRouter } from '../../utils/Router';

interface SidebarProps {
  isOpen: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  currentPage: string;
}

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
    id: 'dashboard',
  },
  {
    label: 'Products',
    icon: Package,
    path: '/admin/products',
    id: 'products',
  },
  {
    label: 'Orders',
    icon: ShoppingCart,
    path: '/admin/orders',
    id: 'orders',
  },
  {
    label: 'Users',
    icon: Users,
    path: '/admin/users',
    id: 'users',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    path: '/admin/analytics',
    id: 'analytics',
  },
  {
    label: 'Hero Slides',
    icon: Image,
    path: '/admin/hero-slides',
    id: 'hero-slides',
  },
  {
    label: 'Memberships',
    icon: Ticket,
    path: '/admin/memberships',
    id: 'memberships',
  },
  {
    label: 'Blogs',
    icon: FileText,
    path: '/admin/blogs',
    id: 'blogs',
  },
  {
    label: 'Newsletter',
    icon: Mail,
    path: '/admin/newsletter',
    id: 'newsletter',
  },
];

export function Sidebar({
  isOpen,
  isMobileOpen,
  onMobileClose,
  currentPage,
}: SidebarProps) {
  const { navigateTo } = useRouter();

  const handleNavigation = (path: string) => {
    navigateTo(path);
    onMobileClose();
  };

  return (
    <>
      <aside
        className={`admin-sidebar ${isOpen ? 'open' : 'closed'} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <div className="admin-logo-icon">📊</div>
            {isOpen && <span>Nivaran Admin</span>}
          </div>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
                title={item.label}
              >
                <Icon size={20} />
                {(isOpen || isMobileOpen) && (
                  <>
                    <span>{item.label}</span>
                    {isActive && <ChevronRight size={16} className="ml-auto" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          {(isOpen || isMobileOpen) && (
            <div className="admin-version">
              <p>Admin v1.0</p>
              <p className="text-xs">Nivaran Store Manager</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
