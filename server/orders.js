const express = require('express');
const router = express.Router();
const db = require('./database');

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

    const product = await db.getAsync('SELECT id, stock, variants, title FROM products WHERE id = ?', [Number(productId)]);
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

// POST /api/orders — place a new order (public)
router.post('/', async (req, res) => {
  const {
    customer_name, customer_email, customer_phone,
    address, city, state, pincode,
    items, subtotal, shipping, total, notes
  } = req.body;

  if (!customer_name || !customer_email || !address || !items || !total) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  try {
    // Validate + decrement stock (supports per-color variants)
    await decrementStockForItems(items);

    const itemsJson = JSON.stringify(items);
    const sql = `INSERT INTO orders 
      (customer_name, customer_email, customer_phone, address, city, state, pincode, items, subtotal, shipping, total, payment_method, payment_status, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;
    const params = [
      customer_name, customer_email, customer_phone || '',
      address, city || '', state || '', pincode || '',
      itemsJson,
      parseFloat(subtotal) || 0,
      parseFloat(shipping) || 0,
      parseFloat(total),
      'COD',
      'pending',
      notes || ''
    ];

    let orderId;
    if (process.env.DATABASE_URL) {
      const row = await db.getAsync(`${sql} RETURNING id`, params);
      orderId = row?.id;
    } else {
      const result = await db.runAsync(sql, params);
      orderId = result?.lastID;
    }

    res.status(201).json({
      success: true,
      orderId,
      message: 'Order placed successfully! We will contact you shortly.'
    });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    const message = err?.message || 'Failed to place order';
    res.status(400).json({ error: message });
  }
});

// GET /api/orders/:id — public order status check
router.get('/:id', async (req, res) => {
  try {
    const order = await db.getAsync(
      'SELECT id, customer_name, customer_email, status, total, created_at FROM orders WHERE id = ?',
      [req.params.id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
