import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import ProductForm from '../components/ProductForm';
import ProductTable from '../components/ProductTable';
import { AdminProduct } from '../../types/admin';
import { apiUrl } from '../../utils/shopApi';
import '../styles/admin.css';

interface ProductsAdminProps {
  onLogout: () => void;
}

export function ProductsAdmin({ onLogout }: ProductsAdminProps) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/admin/products'), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (formData: Partial<AdminProduct>) => {
    try {
      const endpoint = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(apiUrl(endpoint), {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchProducts();
        setShowForm(false);
        setEditingProduct(null);
        alert(editingProduct ? 'Product updated!' : 'Product created!');
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(apiUrl(`/api/admin/products/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchProducts();
        alert('Product deleted!');
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <AdminLayout onLogout={onLogout} currentPage="products">
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Products Management</h1>
          <button
            className="admin-btn primary"
            onClick={() => {
              setEditingProduct(null);
              setShowForm(!showForm);
            }}
          >
            <Plus size={20} />
            {showForm ? 'Cancel' : 'Add New Product'}
          </button>
        </div>

        {/* Product Form */}
        {showForm && (
          <ProductForm
            product={editingProduct}
            onSave={handleAddProduct}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
          />
        )}

        {/* Search Bar */}
        <div className="admin-search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="admin-loading">Loading products...</div>
        ) : (
          <>
            <ProductTable
              products={paginatedProducts}
              onEdit={(product) => {
                setEditingProduct(product);
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDelete={handleDeleteProduct}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`admin-pagination-btn ${
                      currentPage === page ? 'active' : ''
                    }`}
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

export default ProductsAdmin;
