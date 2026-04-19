const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../database');

// ...existing middleware and helpers...

// Admin Auth Middleware
const requireAdminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  // TODO: Implement JWT verification
  req.adminId = 1;
  next();
};

// ===== LOGIN =====
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = await db.getAsync('SELECT * FROM admin_users WHERE username = ?', [username]);

    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token (TODO: Use JWT in production)
    const token = Buffer.from(`${admin.id}:${Date.now()}`).toString('base64');

    res.json({
      success: true,
      token,
      adminId: admin.id,
      username: admin.username,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== STATS =====
router.get('/stats', requireAdminAuth, async (req, res) => {
  try {
    const totalProducts = await db.getAsync('SELECT COUNT(*) as count FROM products');
    const totalOrders = await db.getAsync('SELECT COUNT(*) as count FROM orders');
    const totalUsers = await db.getAsync('SELECT COUNT(*) as count FROM users');
    const totalRevenue = await db.getAsync('SELECT SUM(total) as sum FROM orders WHERE status = ?', ['delivered']);
    const pendingOrders = await db.getAsync('SELECT COUNT(*) as count FROM orders WHERE status = ?', ['pending']);
    const lowStockProducts = await db.getAsync('SELECT COUNT(*) as count FROM products WHERE stock < ?', [10]);

    res.json({
      success: true,
      data: {
        totalProducts: totalProducts?.count || 0,
        totalOrders: totalOrders?.count || 0,
        totalUsers: totalUsers?.count || 0,
        totalRevenue: totalRevenue?.sum || 0,
        pendingOrders: pendingOrders?.count || 0,
        lowStockProducts: lowStockProducts?.count || 0,
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ===== PRODUCTS =====
router.get('/products', requireAdminAuth, async (req, res) => {
  try {
    const products = await db.allAsync('SELECT * FROM products ORDER BY updated_at DESC');
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/products', requireAdminAuth, async (req, res) => {
  try {
    const { title, description, price, compare_at_price, images, category, colors, material, stock, featured } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.runAsync(
      `INSERT INTO products (title, description, price, compare_at_price, images, category, colors, material, stock, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, price, compare_at_price || 0, images || '[]', category, colors || '[]', material, stock || 0, featured ? 1 : 0]
    );

    res.status(201).json({ success: true, data: { id: result.lastID } });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const { title, description, price, compare_at_price, images, category, colors, material, stock, featured } = req.body;

    await db.runAsync(
      `UPDATE products SET title=?, description=?, price=?, compare_at_price=?, images=?, category=?, colors=?, material=?, stock=?, featured=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [title, description, price, compare_at_price || 0, images || '[]', category, colors || '[]', material, stock || 0, featured ? 1 : 0, req.params.id]
    );

    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products/:id', requireAdminAuth, async (req, res) => {
  try {
    await db.runAsync('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ===== ORDERS =====
router.get('/orders', requireAdminAuth, async (req, res) => {
  try {
    const orders = await db.allAsync('SELECT * FROM orders ORDER BY created_at DESC');
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.put('/orders/:id', requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await db.runAsync('UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [status, req.params.id]);
    res.json({ success: true, message: 'Order updated' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ===== USERS =====
router.get('/users', requireAdminAuth, async (req, res) => {
  try {
    const users = await db.allAsync('SELECT id, email, first_name, last_name, phone, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ===== ANALYTICS =====
router.get('/analytics', requireAdminAuth, async (req, res) => {
  try {
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
