export interface AdminProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  compare_at_price?: number;
  images: string | string[];
  category: string;
  colors: string | string[];
  variants?: string | Array<{ color: string; stock: number }>;
  material?: string;
  stock: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminOrder {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_method?: string;
  payment_status?: string;
  payment_order_id?: string;
  payment_id?: string;
  payment_signature?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  shiprocket_order_id?: string;
  shiprocket_shipment_id?: string;
  shiprocket_awb_code?: string;
  shiprocket_courier_name?: string;
  shiprocket_tracking_url?: string;
  shiprocket_status?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  google_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalMemberships: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  pendingMemberships: number;
  lowStockProducts: number;
}

export interface VariantType {
  name: string;
  options: string[];
}

export interface Variant {
  attributes: Record<string, string>;
  price: number;
  stock: number;
}

