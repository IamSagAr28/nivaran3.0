const express = require('express');
const router = express.Router();
const db = require('./database');

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

    db.run(sql, params, async function(err) {
      if (err) {
        console.error('Order insert error:', err);
        return res.status(500).json({ error: 'Failed to place order' });
      }

      const orderId = this.lastID;

      // Optionally update stock
      for (const item of items) {
        if (item.id && item.quantity) {
          db.run(
            'UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?',
            [item.quantity, item.id],
            () => {}
          );
        }
      }

      res.status(201).json({
        success: true,
        orderId,
        message: 'Order placed successfully! We will contact you shortly.'
      });
    });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ error: 'Failed to place order' });
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
