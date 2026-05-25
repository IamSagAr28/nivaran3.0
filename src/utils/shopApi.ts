const RAW_BASE_URL = import.meta.env.VITE_API_URL || '';
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export function apiUrl(path: string) {
  // Expect `path` to start with '/'. Keep local-dev working when API_BASE_URL is empty.
  return `${API_BASE_URL}${path}`;
}

function safeGetAdminToken(): string | null {
  try {
    return localStorage.getItem('adminToken');
  } catch {
    return null;
  }
}

function normalizeHeaders(headers: RequestInit['headers']): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers as Record<string, string>;
}

function shouldAttachAdminToken(path: string) {
  if (!path.startsWith('/api/')) return false;
  if (path.startsWith('/api/admin/login')) return false;
  return (
    path.startsWith('/api/admin') ||
    path.startsWith('/api/newsletter/admin') ||
    path.startsWith('/api/blogs/admin') ||
    path.startsWith('/api/hero-slides/admin')
  );
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const extraHeaders = normalizeHeaders(options.headers);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const token = safeGetAdminToken();
  if (token && shouldAttachAdminToken(path) && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(path), {
    credentials: 'include',
    headers,
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ---- Public Products ----
export async function fetchProducts(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/products${qs ? `?${qs}` : ''}`);
}

export async function fetchProductById(id: string) {
  return apiFetch(`/api/products/${id}`);
}

export async function fetchCategories() {
  return apiFetch('/api/products/categories');
}

// ---- Public Orders ----
export async function placeOrder(orderData: Record<string, unknown>) {
  return apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(orderData) });
}

export async function fetchOrderStatus(id: string) {
  return apiFetch(`/api/orders/${id}`);
}

// ---- Admin Auth ----
export async function adminLogin(username: string, password: string) {
  return apiFetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export async function adminLogout() {
  return apiFetch('/api/admin/logout', { method: 'POST' });
}

export async function fetchAdminMe() {
  return apiFetch('/api/admin/me');
}

// ---- Admin Products ----
export async function fetchAdminProducts() {
  return apiFetch('/api/admin/products');
}

export async function createProduct(data: Record<string, unknown>) {
  return apiFetch('/api/admin/products', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateProduct(id: number, data: Record<string, unknown>) {
  return apiFetch(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteProduct(id: number) {
  return apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
}

// ---- Admin Orders ----
export async function fetchAdminOrders(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return apiFetch(`/api/admin/orders${qs}`);
}

export async function updateOrderStatus(id: number, status: string) {
  return apiFetch(`/api/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
}

export async function deleteOrder(id: number) {
  return apiFetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
}

// ---- Shiprocket ----
export async function createShiprocketShipment(id: number) {
  return apiFetch(`/api/admin/orders/${id}/shiprocket`, { method: 'POST' });
}

// ---- Admin Stats ----
export async function fetchAdminStats() {
  return apiFetch('/api/admin/stats');
}

// ---- Hero Slides ----
export async function fetchHeroSlides() {
  return apiFetch('/api/hero-slides');
}

export async function fetchAdminHeroSlides() {
  return apiFetch('/api/hero-slides/admin');
}

export async function createHeroSlide(data: Record<string, unknown>) {
  return apiFetch('/api/hero-slides/admin', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateHeroSlide(id: number, data: Record<string, unknown>) {
  return apiFetch(`/api/hero-slides/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteHeroSlide(id: number) {
  return apiFetch(`/api/hero-slides/admin/${id}`, { method: 'DELETE' });
}

// ---- Razorpay ----
export async function createRazorpayOrder(amount: number, receipt?: string, notes?: Record<string, string>) {
  return apiFetch('/api/payments/razorpay/order', {
    method: 'POST',
    body: JSON.stringify({ amount, receipt, notes }),
  });
}

export async function verifyRazorpayPayment(payload: Record<string, unknown>) {
  return apiFetch('/api/payments/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function validateOfferCode(code: string) {
  return apiFetch('/api/payments/offer/validate', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

// ---- Admin Change Password ----
export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  return apiFetch('/api/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
