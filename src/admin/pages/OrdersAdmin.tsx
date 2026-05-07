import React, { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { AdminOrder } from '../../types/admin';
import { apiUrl, createShiprocketShipment } from '../../utils/shopApi';
import '../styles/admin.css';

interface OrdersAdminProps {
  onLogout: () => void;
}

export function OrdersAdmin({ onLogout }: OrdersAdminProps) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/admin/orders'), {
        credentials: 'include',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch(apiUrl(`/api/admin/orders/${orderId}/status`), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchOrders();
        alert('Order status updated!');
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleCreateShipment = async (orderId: number) => {
    try {
      await createShiprocketShipment(orderId);
      await fetchOrders();
      alert('Shipment created successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to create shipment');
    }
  };

  const filteredOrders = orders.filter((order) => {
    // Hide memberships from Orders view
    const isMembership = Array.isArray(order.items) && order.items.some((item: any) => 
      item.category === 'Membership' || 
      (item.title && (item.title.toLowerCase().includes('membership') || item.title.toLowerCase().includes('pickup plan') || item.title.toLowerCase().includes('plan')))
    );
    if (isMembership) return false;

    const matchesSearch =
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);

    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const statusColors: Record<string, string> = {
    pending: 'status-pending',
    processing: 'status-processing',
    shipped: 'status-shipped',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled',
  };

  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <AdminLayout onLogout={onLogout} currentPage="orders">
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Orders Management</h1>
          <p>Total Orders: {filteredOrders.length}</p>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="admin-search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by customer name, email, or order ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="admin-filter-select">
            <Filter size={20} />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="admin-loading">Loading orders...</div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr key={order.id}>
                        <td className="order-id">#{order.id}</td>
                        <td>{order.customer_name}</td>
                        <td>{order.customer_email}</td>
                        <td className="order-total">₹{order.total.toFixed(2)}</td>
                        <td>
                          <div className="payment-cell">
                            <div className="payment-method">
                              {(order.payment_method || 'COD').toUpperCase()}
                            </div>
                            <div className="payment-status">
                              {order.payment_status ? order.payment_status.toUpperCase() : 'PENDING'}
                            </div>
                            {(order.payment_id || order.payment_order_id) && (
                              <div className="payment-ids">
                                {order.payment_id && (
                                  <span className="payment-id">PID: {order.payment_id}</span>
                                )}
                                {order.payment_order_id && (
                                  <span className="payment-id">OID: {order.payment_order_id}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${statusColors[order.status]}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="orders-actions">
                            <button
                              className="view-btn text-sm font-semibold text-[#1e40af] hover:underline"
                              onClick={() => toggleOrderDetails(order.id)}
                            >
                              {expandedOrder === order.id ? 'Hide Items' : 'View Items'}
                            </button>
                            <select
                              className="status-select"
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {order.shiprocket_shipment_id ? (
                              <span className="shiprocket-badge bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">Shipment Created</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCreateShipment(order.id)}
                                className="shiprocket-btn bg-pink-500 hover:bg-pink-600 text-white px-2 py-1 rounded text-xs font-semibold transition"
                              >
                                Create Shipment
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedOrder === order.id && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan={8} className="p-4">
                            <div className="space-y-4">
                              <h4 className="font-bold text-gray-800 border-b pb-2">Order Summary</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong className="text-xs uppercase text-gray-500">Shipping Details</strong>
                                  <p className="text-sm mt-1">{order.address}</p>
                                  <p className="text-sm">{order.city}, {order.state} - {order.pincode}</p>
                                  <p className="text-sm mt-1">Phone: {order.customer_phone}</p>
                                  {order.notes && <p className="text-sm mt-2 italic text-gray-600 tracking-tight">Note: {order.notes}</p>}
                                </div>
                                <div className="space-y-3">
                                  <strong className="text-xs uppercase text-gray-500">Items Ordered</strong>
                                  {Array.isArray(order.items) && order.items.length > 0 ? (
                                    <div className="bg-white rounded p-3 shadow-sm border border-gray-200">
                                      {order.items.map((item: any, i: number) => (
                                        <div key={item.id || i} className="flex justify-between items-center text-sm border-b border-gray-100 py-2 last:border-0 last:pb-0">
                                          <div className="flex gap-3 items-center">
                                            {item.image && (
                                              <div className="w-8 h-8 rounded border overflow-hidden flex-shrink-0">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                              </div>
                                            )}
                                            <div>
                                              <p className="font-semibold text-gray-800">{item.title}</p>
                                              <p className="text-xs text-gray-500">{item.material}</p>
                                            </div>
                                          </div>
                                          <div className="text-right whitespace-nowrap pl-4">
                                            <p className="text-gray-600">{item.quantity} x ₹{item.price}</p>
                                            <p className="font-bold text-gray-800">₹{(item.quantity * item.price).toFixed(2)}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-500 italic">No items found (could be raw string inside DB: {typeof order.items === 'string' ? order.items : 'Unknown'})</div>
                                  )}
                                  <div className="flex flex-col items-end gap-1 text-sm bg-white p-3 rounded shadow-sm border border-gray-200">
                                    <span>Subtotal: <strong>₹{order.subtotal?.toFixed(2) || '0.00'}</strong></span>
                                    <span>Shipping: <strong>₹{order.shipping?.toFixed(2) || '0.00'}</strong></span>
                                    <span className="border-t border-gray-200 w-full text-right pt-1 mt-1 text-base">Total: <strong className="text-[#e7335d]">₹{order.total?.toFixed(2) || '0.00'}</strong></span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="admin-pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`admin-pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default OrdersAdmin;
