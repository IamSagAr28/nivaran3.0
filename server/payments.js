const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('./database');

const router = express.Router();

// --- Settings storage (SQLite + Postgres) ---
async function ensureSiteSettingsTable() {
  try {
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS site_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    try {
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS site_settings (
          setting_key TEXT PRIMARY KEY,
          setting_value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e2) {
      console.error('Failed to ensure site_settings table:', e2);
    }
  }
}

async function getNewsletterDiscountCode() {
  const envCode = (process.env.NEWSLETTER_DISCOUNT_CODE || '').trim();
  try {
    await ensureSiteSettingsTable();
    const row = await db.getAsync(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['newsletter_discount_code']
    );

    if (row && Object.prototype.hasOwnProperty.call(row, 'setting_value')) {
      return (row.setting_value ?? '').toString().trim();
    }

    return envCode;
  } catch (e) {
    return envCode;
  }
}

// Validate offer code (public)
router.post('/offer/validate', async (req, res) => {
  try {
    const code = (req.body?.code || '').toString().trim();
    if (!code) return res.json({ valid: false, percent: 0 });

    const expected = await getNewsletterDiscountCode();
    if (!expected) return res.json({ valid: false, percent: 0 });

    const valid = code.toLowerCase() === expected.toLowerCase();
    return res.json({ valid, percent: valid ? 10 : 0 });
  } catch (err) {
    console.error('Offer validate error:', err);
    return res.status(500).json({ error: 'Failed to validate offer code' });
  }
});

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function verifySignature(orderId, paymentId, signature, secret) {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

function normalizeColor(value) {
  return String(value || '').trim().toLowerCase();
}

async function decrementStockForItems(items) {
  for (const item of items) {
    const productId = String(item.productId ?? item.id ?? '');
    const quantity = Number(item.quantity ?? 0);
    const selectedColor = item.variantColor ?? item.color ?? item.selectedColor;

    if (!productId || !Number.isFinite(quantity) || quantity <= 0) continue;

    // Allow non-product cart items (e.g. memberships) to pass through.
    if (!/^\d+$/.test(productId)) continue;

    const product = await db.getAsync('SELECT id, stock, variants FROM products WHERE id = ?', [Number(productId)]);
    if (!product) {
      throw new Error('One or more products are unavailable');
    }

    let variants = [];
    try {
      variants = typeof product.variants === 'string' ? JSON.parse(product.variants || '[]') : (product.variants || []);
    } catch {
      variants = [];
    }

    if (Array.isArray(variants) && variants.length) {
      if (!selectedColor) {
        throw new Error('Please select a color for all items');
      }
      const idx = variants.findIndex(v => normalizeColor(v?.color) === normalizeColor(selectedColor));
      if (idx < 0) {
        throw new Error('Selected color is not available for one or more items');
      }
      const available = Number(variants[idx]?.stock ?? 0);
      if (!Number.isFinite(available) || available < quantity) {
        throw new Error('Insufficient stock for one or more items');
      }

      variants[idx] = { ...variants[idx], stock: available - quantity };
      const totalStock = variants.reduce((sum, v) => sum + Math.max(0, Number(v?.stock ?? 0)), 0);
      const colors = variants.map(v => v.color).filter(Boolean);

      await db.runAsync(
        'UPDATE products SET variants = ?, colors = ?, stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(variants), JSON.stringify(colors), totalStock, Number(productId)]
      );
    } else {
      const available = Number(product.stock ?? 0);
      if (!Number.isFinite(available) || available < quantity) {
        throw new Error('Insufficient stock for one or more items');
      }

      await db.runAsync(
        'UPDATE products SET stock = CASE WHEN stock - ? < 0 THEN 0 ELSE stock - ? END, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [quantity, quantity, Number(productId)]
      );
    }
  }
}

async function insertOrder(orderData, payment) {
  const {
    customer_name, customer_email, customer_phone,
    address, city, state, pincode,
    items, subtotal, shipping, total, notes,
  } = orderData;

  if (!customer_name || !customer_email || !address || !items || !total) {
    throw new Error('Missing required fields');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty');
  }

  // Validate + decrement stock (supports per-color variants)
  await decrementStockForItems(items);

  const itemsJson = JSON.stringify(items);
  const sql = `INSERT INTO orders 
    (customer_name, customer_email, customer_phone, address, city, state, pincode, items, subtotal, shipping, total, payment_method, payment_status, payment_order_id, payment_id, payment_signature, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;
  const params = [
    customer_name, customer_email, customer_phone || '',
    address, city || '', state || '', pincode || '',
    itemsJson,
    parseFloat(subtotal) || 0,
    parseFloat(shipping) || 0,
    parseFloat(total),
    payment.method || null,
    payment.status || null,
    payment.order_id || null,
    payment.payment_id || null,
    payment.signature || null,
    notes || ''
  ];

  if (process.env.DATABASE_URL) {
    const row = await db.getAsync(`${sql} RETURNING id`, params);
    return row?.id;
  }

  const result = await db.runAsync(sql, params);
  return result?.lastID;
}

// Create Razorpay order
router.post('/razorpay/order', async (req, res) => {
  const razorpay = getRazorpayClient();
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!razorpay || !keyId) {
    return res.status(400).json({ error: 'Razorpay is not configured' });
  }

  const { amount, receipt, notes } = req.body;
  const totalAmount = Number(amount);
  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: receipt || `order_${Date.now()}`,
      payment_capture: 1,
      notes: notes || {},
    });

    res.json({
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

// Verify payment and create order
router.post('/razorpay/verify', async (req, res) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return res.status(400).json({ error: 'Razorpay is not configured' });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing Razorpay payment details' });
  }

  const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
  if (!isValid) return res.status(400).json({ error: 'Payment verification failed' });

  try {
    const orderId = await insertOrder(orderData, {
      method: 'ONLINE',
      status: 'paid',
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
    });

    res.json({ success: true, orderId });
  } catch (err) {
    console.error('Verify Razorpay payment error:', err);
    res.status(500).json({ error: 'Failed to place order', details: err.message });
  }
});

module.exports = router;
