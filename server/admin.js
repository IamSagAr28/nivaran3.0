const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('./database');
const shiprocket = require('./shiprocket');
const { signAdminToken, verifyAdminToken } = require('./utils/adminToken');

// Helper: parse JSON fields
function parseProduct(p) {
  if (!p) return null;
  return {
    ...p,
    // pg returns DECIMAL as string; ensure frontend always receives numbers
    price: p.price == null ? p.price : Number(p.price),
    compare_at_price:
      p.compare_at_price == null ? p.compare_at_price : Number(p.compare_at_price),
    stock: p.stock == null ? p.stock : Number(p.stock),
    featured: p.featured == null ? p.featured : Number(p.featured),
    images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []),
    colors: typeof p.colors === 'string' ? JSON.parse(p.colors || '[]') : (p.colors || []),
    variants: typeof p.variants === 'string' ? JSON.parse(p.variants || '[]') : (p.variants || []),
    variant_types: typeof p.variant_types === 'string' ? JSON.parse(p.variant_types || '[]') : (p.variant_types || []),
  };
}

// Helper: safe JSON parsing for arrays from req.body (handles strings or raw arrays)
function safeParseJsonArray(input) {
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeVariantsInput(input) {
  if (input == null || input === '') return [];
  const raw = typeof input === 'string' ? JSON.parse(input) : input;
  if (!Array.isArray(raw)) return [];
  return raw
    .map(v => ({
      color: typeof v?.color === 'string' ? v.color.trim() : '',
      stock: Number(v?.stock ?? 0),
    }))
    .filter(v => v.color);
}

function normalizeColorsInput(input) {
  if (input == null || input === '') return [];
  const raw = typeof input === 'string' ? JSON.parse(input) : input;
  if (!Array.isArray(raw)) return [];
  return raw.map(c => String(c).trim()).filter(Boolean);
}

// --- Admin Auth Middleware ---
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    req.adminId = req.session.adminId;
    req.adminUsername = req.session.adminUsername;
    return next();
  }

  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const payload = verifyAdminToken(token);
    if (payload) {
      req.adminId = payload.adminId;
      req.adminUsername = payload.username;
      return next();
    }
  }

  return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
}

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  try {
    const admin = await db.getAsync('SELECT * FROM admin_users WHERE username = ?', [username]);
    
    if (!admin) {
      console.error(`Admin login failed: User "${username}" not found in database`);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        debug: {
          userNotFound: true,
          username: username,
          message: 'Admin user not found in database'
        }
      });
    }

    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid) {
      console.error(`Admin login failed: Invalid password for user "${username}"`);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        debug: {
          invalidPassword: true,
          username: username
        }
      });
    }

    console.log(`✅ Admin login successful: ${username}`);

    // Generate a signed token (works even when cookies are blocked)
    const adminToken = signAdminToken({ adminId: admin.id, username: admin.username });
    
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    req.session.adminToken = adminToken;
    
    res.json({ success: true, adminId: admin.id, username: admin.username, token: adminToken });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ 
      error: 'Login failed',
      debug: {
        errorMessage: err.message
      }
    });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  req.session.adminId = null;
  req.session.adminUsername = null;
  req.session.adminToken = null;
  res.json({ success: true });
});

// GET /api/admin/me
router.get('/me', requireAdmin, (req, res) => {
  res.json({
    adminId: req.adminId || req.session?.adminId || null,
    username: req.adminUsername || req.session?.adminUsername || null,
  });
});

// ===================== USERS ======================

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await db.allAsync(
      'SELECT id, email, first_name, last_name, phone, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await db.runAsync('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ===================== PRODUCTS ======================

// GET /api/admin/products
router.get('/products', requireAdmin, async (req, res) => {
  try {
    const { includeImages } = req.query;
    const withImages = includeImages === '1' || includeImages === 'true';
    const selectCols = withImages
      ? '*'
      : 'id, title, description, price, compare_at_price, category, colors, variants, material, stock, featured, created_at, updated_at';

    const rows = await db.allAsync(`SELECT ${selectCols} FROM products ORDER BY created_at DESC`);
    res.json({ products: rows.map(parseProduct) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/admin/products/:id
router.get('/products/:id', requireAdmin, async (req, res) => {
  try {
    const product = await db.getAsync('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(parseProduct(product));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/admin/products
router.post('/products', requireAdmin, async (req, res) => {
  const { 
    title, description, price, compare_at_price, images, category, 
    material, stock, featured, variants, variant_types 
  } = req.body;

  if (!title || !price) return res.status(400).json({ error: 'Title and price are required' });

  try {
    const imagesJson = JSON.stringify(safeParseJsonArray(images));
    const variantsJson = JSON.stringify(safeParseJsonArray(variants));
    const variantTypesJson = JSON.stringify(safeParseJsonArray(variant_types));

    const sql = `INSERT INTO products 
      (title, description, price, compare_at_price, images, category, material, stock, featured, variants, variant_types)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      title, description || '',
      parseFloat(price),
      compare_at_price ? parseFloat(compare_at_price) : null,
      imagesJson, category || '',
      material || '',
      parseInt(stock) || 0,
      featured ? 1 : 0,
      variantsJson,
      variantTypesJson
    ];

    if (process.env.DATABASE_URL) {
      const pgSql = `INSERT INTO products 
        (title, description, price, compare_at_price, images, category, material, stock, featured, variants, variant_types)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`;
      
      try {
        const result = await db.getAsync(pgSql, params);
        const created = parseProduct(result);
        created.images = []; // Keep response small
        return res.status(201).json(created);
      } catch (pgErr) {
        console.error('Postgres INSERT error:', pgErr);
        return res.status(500).json({ error: 'Failed to create product with Postgres', detail: pgErr.message });
      }
    } else {
      // SQLite branch
      db.run(sql, params, async function(err) {
        if (err) return res.status(500).json({ error: 'Failed to create product', detail: err.message });
        const newProduct = await db.getAsync('SELECT * FROM products WHERE id = ?', [this.lastID]);
        const created = parseProduct(newProduct);
        created.images = [];
        res.status(201).json(created);
      });
    }
  } catch (err) {
    console.error('POST /admin/products error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', requireAdmin, async (req, res) => {
  const { 
    title, description, price, compare_at_price, images, category, 
    material, stock, featured, variants, variant_types 
  } = req.body;
  const { id } = req.params;

  try {
    const imagesJson = JSON.stringify(safeParseJsonArray(images));
    const variantsJson = JSON.stringify(safeParseJsonArray(variants));
    const variantTypesJson = JSON.stringify(safeParseJsonArray(variant_types));

    const sql = `UPDATE products SET 
      title=?, description=?, price=?, compare_at_price=?, images=?, 
      category=?, material=?, stock=?, featured=?, variants=?, variant_types=?, 
      updated_at=CURRENT_TIMESTAMP
      WHERE id=?`;
    const params = [
      title, description || '',
      parseFloat(price),
      compare_at_price ? parseFloat(compare_at_price) : null,
      imagesJson, category || '',
      material || '',
      parseInt(stock) || 0,
      featured ? 1 : 0,
      variantsJson,
      variantTypesJson,
      id
    ];

    db.run(sql, params, async function(err) {
      if (err) return res.status(500).json({ error: 'Failed to update product', detail: err.message });
      const updated = await db.getAsync('SELECT * FROM products WHERE id = ?', [id]);
      const parsed = parseProduct(updated);
      // Keep response small; images can be fetched via GET /api/admin/products/:id
      parsed.images = [];
      res.json(parsed);
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to delete product' });
    res.json({ success: true });
  });
});

// ===================== ORDERS ======================

// GET /api/admin/orders
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM orders';
    const params = [];
    if (status) { sql += ' WHERE status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    const rows = await db.allAsync(sql, params);
    const orders = rows.map(o => ({
      ...o,
      subtotal: o.subtotal == null ? o.subtotal : Number(o.subtotal),
      shipping: o.shipping == null ? o.shipping : Number(o.shipping),
      total: o.total == null ? o.total : Number(o.total),
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
    }));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/admin/orders/:id
router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await db.getAsync('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({
      ...order,
      subtotal: order.subtotal == null ? order.subtotal : Number(order.subtotal),
      shipping: order.shipping == null ? order.shipping : Number(order.shipping),
      total: order.total == null ? order.total : Number(order.total),
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  db.run(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to update order status' });
      res.json({ success: true, status });
    }
  );
});

// DELETE /api/admin/orders/:id
router.delete('/orders/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM orders WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to delete order' });
    res.json({ success: true });
  });
});

// POST /api/admin/orders/:id/shiprocket
router.post('/orders/:id/shiprocket', requireAdmin, async (req, res) => {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  const channelId = process.env.SHIPROCKET_CHANNEL_ID;
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION;
  const weight = process.env.SHIPROCKET_WEIGHT || '0.5';
  const length = process.env.SHIPROCKET_LENGTH || '10';
  const breadth = process.env.SHIPROCKET_BREADTH || '10';
  const height = process.env.SHIPROCKET_HEIGHT || '10';

  if (!email || !password || !channelId || !pickupLocation) {
    return res.status(400).json({
      error: 'Shiprocket is not configured. Set SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD, SHIPROCKET_CHANNEL_ID, SHIPROCKET_PICKUP_LOCATION.'
    });
  }

  try {
    const order = await db.getAsync('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.shiprocket_shipment_id || order.shiprocket_order_id) {
      return res.status(400).json({ error: 'Shipment already created for this order' });
    }

    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    const result = await shiprocket.createShipment(order, items, {
      email,
      password,
      channelId,
      pickupLocation,
      weight,
      length,
      breadth,
      height,
    });

    const shiprocketOrderId = result?.order_id || null;
    const shipmentId = result?.shipment_id || null;
    const awbCode = result?.awb_code || null;
    const courierName = result?.courier_name || null;
    const trackingUrl = result?.tracking_url || null;
    const shiprocketStatus = result?.status || result?.status_code || null;

    const nextStatus = order.status === 'pending' ? 'processing' : order.status;

    await db.runAsync(
      `UPDATE orders SET
        shiprocket_order_id = ?,
        shiprocket_shipment_id = ?,
        shiprocket_awb_code = ?,
        shiprocket_courier_name = ?,
        shiprocket_tracking_url = ?,
        shiprocket_status = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        shiprocketOrderId,
        shipmentId,
        awbCode,
        courierName,
        trackingUrl,
        shiprocketStatus,
        nextStatus,
        req.params.id,
      ]
    );

    res.json({
      success: true,
      shiprocket_order_id: shiprocketOrderId,
      shiprocket_shipment_id: shipmentId,
      shiprocket_awb_code: awbCode,
      shiprocket_courier_name: courierName,
      shiprocket_tracking_url: trackingUrl,
      shiprocket_status: shiprocketStatus,
    });
  } catch (err) {
    const responseData = err?.response?.data;
    console.error('Shiprocket create shipment error:', responseData || err);
    const apiError = responseData?.message || responseData?.errors || err?.message;
    res.status(500).json({
      error: apiError || 'Failed to create shipment',
      detail: responseData || undefined,
    });
  }
});

// ===================== DASHBOARD STATS ======================
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [productCount, orderCount, pendingOrders, totalRevenue] = await Promise.all([
      db.getAsync('SELECT COUNT(*) as count FROM products'),
      db.getAsync('SELECT COUNT(*) as count FROM orders'),
      db.getAsync("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"),
      db.getAsync("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'cancelled'"),
    ]);
    res.json({
      products: productCount?.count || 0,
      orders: orderCount?.count || 0,
      pending: pendingOrders?.count || 0,
      revenue: parseFloat(totalRevenue?.total || 0),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ===================== CHANGE PASSWORD ======================
router.post('/change-password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both passwords required' });

  try {
    const adminId = req.adminId || req.session?.adminId;
    const admin = await db.getAsync('SELECT * FROM admin_users WHERE id = ?', [adminId]);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const valid = bcrypt.compareSync(currentPassword, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.run('UPDATE admin_users SET password_hash = ? WHERE id = ?', [newHash, admin.id], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to change password' });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
module.exports.requireAdmin = requireAdmin;
