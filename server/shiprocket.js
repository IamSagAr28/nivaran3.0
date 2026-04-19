const axios = require('axios');

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken = null;
let tokenExpiresAt = 0;

async function login(email, password) {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  const token = res?.data?.token;
  if (!token) throw new Error('Shiprocket auth failed');

  // Shiprocket tokens typically last 10 days, cache for 9 days.
  cachedToken = token;
  tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return token;
}

async function getToken(email, password) {
  if (cachedToken && Date.now() < tokenExpiresAt - 60 * 1000) {
    return cachedToken;
  }
  return login(email, password);
}

function buildOrderPayload(order, items, options) {
  const {
    pickupLocation,
    channelId,
    weight,
    length,
    breadth,
    height,
  } = options;

  const orderItems = (items || []).map((item) => ({
    name: item.title || `Item ${item.id}`,
    sku: String(item.id || item.title || 'SKU'),
    units: Number(item.quantity || 1),
    selling_price: Number(item.price || 0),
    discount: 0,
    tax: 0,
    hsn: item.hsn || undefined,
  }));

  return {
    order_id: `NIV-${order.id}`,
    order_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    pickup_location: pickupLocation,
    channel_id: Number(channelId),
    billing_customer_name: order.customer_name,
    billing_last_name: '',
    billing_address: order.address,
    billing_city: order.city || '',
    billing_pincode: order.pincode || '',
    billing_state: order.state || '',
    billing_country: 'India',
    billing_email: order.customer_email,
    billing_phone: order.customer_phone || '',
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: 'COD',
    sub_total: Number(order.subtotal || order.total || 0),
    length: Number(length),
    breadth: Number(breadth),
    height: Number(height),
    weight: Number(weight),
  };
}

async function createShipment(order, items, options) {
  const token = await getToken(options.email, options.password);
  const payload = buildOrderPayload(order, items, options);
  const res = await axios.post(`${BASE_URL}/orders/create/adhoc`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

module.exports = {
  createShipment,
};
