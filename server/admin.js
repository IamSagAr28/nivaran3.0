const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('./database');
const shiprocket = require('./shiprocket');
const { signAdminToken, verifyAdminToken } = require('./utils/adminToken');
const { generateSitemapXml } = require('./sitemap-generator');

function triggerSitemapUpdate() {
  setTimeout(async () => {
    try {
      await generateSitemapXml(db);
    } catch (e) {
      console.warn('Background sitemap sync warning:', e.message);
    }
  }, 100);
}

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
    city_descriptions: typeof p.city_descriptions === 'string' ? JSON.parse(p.city_descriptions || '{}') : (p.city_descriptions || {}),
    showcase_sections: typeof p.showcase_sections === 'string' ? JSON.parse(p.showcase_sections || '[]') : (p.showcase_sections || []),
    city_showcase_sections: typeof p.city_showcase_sections === 'string' ? JSON.parse(p.city_showcase_sections || '{}') : (p.city_showcase_sections || {}),
    why_choose_us: typeof p.why_choose_us === 'string' ? JSON.parse(p.why_choose_us || '{}') : (p.why_choose_us || {}),
    custom_slug: p.custom_slug || '',
    city_slugs: typeof p.city_slugs === 'string' ? JSON.parse(p.city_slugs || '{}') : (p.city_slugs || {}),
    meta_title: p.meta_title || '',
    meta_description: p.meta_description || '',
    canonical_url: p.canonical_url || '',
  };
}

// Helper: safe JSON parsing for objects from req.body
function safeParseJsonObject(input) {
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
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

    const valid = await bcrypt.compare(password, admin.password_hash);
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
      : 'id, title, description, price, compare_at_price, category, colors, variants, material, stock, featured, city_descriptions, showcase_sections, city_showcase_sections, why_choose_us, custom_slug, city_slugs, meta_title, meta_description, canonical_url, created_at, updated_at';

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
    material, stock, featured, variants, variant_types, city_descriptions,
    showcase_sections, city_showcase_sections, why_choose_us, custom_slug, city_slugs,
    meta_title, meta_description, canonical_url
  } = req.body;

  if (!title || !price) return res.status(400).json({ error: 'Title and price are required' });

  try {
    const imagesJson = JSON.stringify(safeParseJsonArray(images));
    const variantsJson = JSON.stringify(safeParseJsonArray(variants));
    const variantTypesJson = JSON.stringify(safeParseJsonArray(variant_types));
    const cityDescriptionsJson = JSON.stringify(safeParseJsonObject(city_descriptions));
    const showcaseSectionsJson = JSON.stringify(safeParseJsonArray(showcase_sections));
    const cityShowcaseSectionsJson = JSON.stringify(safeParseJsonObject(city_showcase_sections));
    const whyChooseUsJson = JSON.stringify(safeParseJsonObject(why_choose_us));
    const citySlugsJson = JSON.stringify(safeParseJsonObject(city_slugs));
    const formattedSlug = (custom_slug || '').trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const cleanMetaTitle = (meta_title || '').trim();
    const cleanMetaDesc = (meta_description || '').trim();
    const cleanCanonical = (canonical_url || '').trim();

    const sql = `INSERT INTO products 
      (title, description, price, compare_at_price, images, category, material, stock, featured, variants, variant_types, city_descriptions, showcase_sections, city_showcase_sections, why_choose_us, custom_slug, city_slugs, meta_title, meta_description, canonical_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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
      cityDescriptionsJson,
      showcaseSectionsJson,
      cityShowcaseSectionsJson,
      whyChooseUsJson,
      formattedSlug,
      citySlugsJson,
      cleanMetaTitle,
      cleanMetaDesc,
      cleanCanonical
    ];

    if (process.env.DATABASE_URL) {
      const pgSql = `INSERT INTO products 
        (title, description, price, compare_at_price, images, category, material, stock, featured, variants, variant_types, city_descriptions, showcase_sections, city_showcase_sections, why_choose_us, custom_slug, city_slugs, meta_title, meta_description, canonical_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`;
      
      try {
        const result = await db.getAsync(pgSql, params);
        const created = parseProduct(result);
        created.images = []; // Keep response small
        triggerSitemapUpdate();
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
        triggerSitemapUpdate();
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
    material, stock, featured, variants, variant_types, city_descriptions,
    showcase_sections, city_showcase_sections, why_choose_us, custom_slug, city_slugs,
    meta_title, meta_description, canonical_url
  } = req.body;
  const { id } = req.params;

  try {
    const imagesJson = JSON.stringify(safeParseJsonArray(images));
    const variantsJson = JSON.stringify(safeParseJsonArray(variants));
    const variantTypesJson = JSON.stringify(safeParseJsonArray(variant_types));
    const cityDescriptionsJson = JSON.stringify(safeParseJsonObject(city_descriptions));
    const showcaseSectionsJson = JSON.stringify(safeParseJsonArray(showcase_sections));
    const cityShowcaseSectionsJson = JSON.stringify(safeParseJsonObject(city_showcase_sections));
    const whyChooseUsJson = JSON.stringify(safeParseJsonObject(why_choose_us));
    const citySlugsJson = JSON.stringify(safeParseJsonObject(city_slugs));
    const formattedSlug = (custom_slug || '').trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const cleanMetaTitle = (meta_title || '').trim();
    const cleanMetaDesc = (meta_description || '').trim();
    const cleanCanonical = (canonical_url || '').trim();

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
      cityDescriptionsJson,
      showcaseSectionsJson,
      cityShowcaseSectionsJson,
      whyChooseUsJson,
      formattedSlug,
      citySlugsJson,
      cleanMetaTitle,
      cleanMetaDesc,
      cleanCanonical,
      id
    ];

    if (process.env.DATABASE_URL) {
      // PostgreSQL uses $1, $2, ... placeholders
      const pgSql = `UPDATE products SET 
        title=$1, description=$2, price=$3, compare_at_price=$4, images=$5, 
        category=$6, material=$7, stock=$8, featured=$9, variants=$10, variant_types=$11, city_descriptions=$12, 
        showcase_sections=$13, city_showcase_sections=$14, why_choose_us=$15, custom_slug=$16, city_slugs=$17,
        meta_title=$18, meta_description=$19, canonical_url=$20,
        updated_at=CURRENT_TIMESTAMP
        WHERE id=$21 RETURNING *`;
      try {
        const result = await db.getAsync(pgSql, params);
        const parsed = parseProduct(result);
        parsed.images = [];
        triggerSitemapUpdate();
        return res.json(parsed);
      } catch (pgErr) {
        console.error('Postgres UPDATE error:', pgErr);
        return res.status(500).json({ error: 'Failed to update product', detail: pgErr.message });
      }
    } else {
      // SQLite uses ? placeholders
      const sql = `UPDATE products SET 
        title=?, description=?, price=?, compare_at_price=?, images=?, 
        category=?, material=?, stock=?, featured=?, variants=?, variant_types=?, city_descriptions=?, 
        showcase_sections=?, city_showcase_sections=?, why_choose_us=?, custom_slug=?, city_slugs=?,
        meta_title=?, meta_description=?, canonical_url=?,
        updated_at=CURRENT_TIMESTAMP
        WHERE id=?`;
      db.run(sql, params, async function(err) {
        if (err) return res.status(500).json({ error: 'Failed to update product', detail: err.message });
        const updated = await db.getAsync('SELECT * FROM products WHERE id = ?', [id]);
        const parsed = parseProduct(updated);
        parsed.images = [];
        triggerSitemapUpdate();
        res.json(parsed);
      });
    }
  } catch (err) {
    console.error('PUT /admin/products error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      await db.getAsync('DELETE FROM products WHERE id = $1', [req.params.id]);
    } else {
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
          if (err) reject(err); else resolve();
        });
      });
    }
    triggerSitemapUpdate();
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /admin/products error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
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
    const [productCountResult, ordersResult] = await Promise.all([
      db.getAsync('SELECT COUNT(*) as count FROM products'),
      db.allAsync('SELECT items, status, total FROM orders')
    ]);

    let productOrders = 0;
    let pendingProductOrders = 0;
    let memberships = 0;
    let pendingMemberships = 0;
    let totalRevenue = 0;

    (ordersResult || []).forEach(o => {
      if (o.status !== 'cancelled') {
        totalRevenue += Number(o.total || 0);
      }
      
      let items = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch (e) {}

      if (!Array.isArray(items)) return;

      const hasMembership = items.some(item => {
        const title = item.title ? item.title.toLowerCase() : '';
        return item.category === 'Membership' || title.includes('membership') || title.includes('pickup plan');
      });

      const hasProduct = items.some(item => {
        const title = item.title ? item.title.toLowerCase() : '';
        return !(item.category === 'Membership' || title.includes('membership') || title.includes('pickup plan'));
      });

      if (hasProduct) {
        productOrders++;
        if (o.status === 'pending') pendingProductOrders++;
      }
      
      if (hasMembership) {
        memberships++;
        if (o.status === 'pending') pendingMemberships++;
      }
    });

    res.json({
      products: productCountResult?.count || 0,
      orders: productOrders,
      pending: pendingProductOrders,
      memberships: memberships,
      pendingMemberships: pendingMemberships,
      revenue: totalRevenue,
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

// ===================== PAGE SEO ======================

// GET /api/admin/page-seo
router.get('/page-seo', requireAdmin, async (req, res) => {
  try {
    const pages = await db.allAsync('SELECT * FROM page_seo ORDER BY id ASC');
    res.json({ pages: pages || [] });
  } catch (err) {
    console.error('GET /api/admin/page-seo error:', err);
    res.status(500).json({ error: 'Failed to fetch page SEO entries' });
  }
});

// POST /api/admin/page-seo
router.post('/page-seo', requireAdmin, async (req, res) => {
  const { page_path, page_name, meta_title, meta_description, canonical_url, og_image, no_index } = req.body;
  if (!page_path) return res.status(400).json({ error: 'page_path is required' });

  try {
    const cleanPath = '/' + page_path.trim().replace(/^\/+/, '');
    const cleanName = (page_name || cleanPath).trim();
    const cleanTitle = (meta_title || '').trim();
    const cleanDesc = (meta_description || '').trim();
    const cleanCanonical = (canonical_url || '').trim();
    const cleanOgImage = (og_image || '').trim();
    const cleanNoIndex = no_index ? 1 : 0;

    if (process.env.DATABASE_URL) {
      const pgSql = `
        INSERT INTO page_seo (page_path, page_name, meta_title, meta_description, canonical_url, og_image, no_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (page_path) DO UPDATE SET
          page_name = EXCLUDED.page_name,
          meta_title = EXCLUDED.meta_title,
          meta_description = EXCLUDED.meta_description,
          canonical_url = EXCLUDED.canonical_url,
          og_image = EXCLUDED.og_image,
          no_index = EXCLUDED.no_index,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`;
      const result = await db.getAsync(pgSql, [cleanPath, cleanName, cleanTitle, cleanDesc, cleanCanonical, cleanOgImage, cleanNoIndex]);
      triggerSitemapUpdate();
      return res.status(201).json(result);
    } else {
      const sqliteSql = `
        INSERT INTO page_seo (page_path, page_name, meta_title, meta_description, canonical_url, og_image, no_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(page_path) DO UPDATE SET
          page_name = excluded.page_name,
          meta_title = excluded.meta_title,
          meta_description = excluded.meta_description,
          canonical_url = excluded.canonical_url,
          og_image = excluded.og_image,
          no_index = excluded.no_index,
          updated_at = CURRENT_TIMESTAMP`;
      await db.runAsync(sqliteSql, [cleanPath, cleanName, cleanTitle, cleanDesc, cleanCanonical, cleanOgImage, cleanNoIndex]);
      const saved = await db.getAsync('SELECT * FROM page_seo WHERE page_path = ?', [cleanPath]);
      triggerSitemapUpdate();
      return res.status(201).json(saved);
    }
  } catch (err) {
    console.error('POST /api/admin/page-seo error:', err);
    res.status(500).json({ error: 'Failed to save page SEO entry', detail: err.message });
  }
});

// PUT /api/admin/page-seo/:id
router.put('/page-seo/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { page_path, page_name, meta_title, meta_description, canonical_url, og_image, no_index } = req.body;

  try {
    const cleanPath = page_path ? '/' + page_path.trim().replace(/^\/+/, '') : undefined;
    const cleanName = page_name !== undefined ? page_name.trim() : undefined;
    const cleanTitle = meta_title !== undefined ? meta_title.trim() : '';
    const cleanDesc = meta_description !== undefined ? meta_description.trim() : '';
    const cleanCanonical = canonical_url !== undefined ? canonical_url.trim() : '';
    const cleanOgImage = og_image !== undefined ? og_image.trim() : '';
    const cleanNoIndex = no_index ? 1 : 0;

    if (process.env.DATABASE_URL) {
      const pgSql = `
        UPDATE page_seo SET
          page_path = COALESCE($1, page_path),
          page_name = COALESCE($2, page_name),
          meta_title = $3,
          meta_description = $4,
          canonical_url = $5,
          og_image = $6,
          no_index = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *`;
      const result = await db.getAsync(pgSql, [cleanPath, cleanName, cleanTitle, cleanDesc, cleanCanonical, cleanOgImage, cleanNoIndex, id]);
      triggerSitemapUpdate();
      return res.json(result);
    } else {
      const sqliteSql = `
        UPDATE page_seo SET
          page_path = COALESCE(?, page_path),
          page_name = COALESCE(?, page_name),
          meta_title = ?,
          meta_description = ?,
          canonical_url = ?,
          og_image = ?,
          no_index = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;
      await db.runAsync(sqliteSql, [cleanPath, cleanName, cleanTitle, cleanDesc, cleanCanonical, cleanOgImage, cleanNoIndex, id]);
      const updated = await db.getAsync('SELECT * FROM page_seo WHERE id = ?', [id]);
      triggerSitemapUpdate();
      return res.json(updated);
    }
  } catch (err) {
    console.error('PUT /api/admin/page-seo/:id error:', err);
    res.status(500).json({ error: 'Failed to update page SEO entry', detail: err.message });
  }
});

// DELETE /api/admin/page-seo/:id
router.delete('/page-seo/:id', requireAdmin, async (req, res) => {
  try {
    await db.runAsync('DELETE FROM page_seo WHERE id = ?', [req.params.id]);
    triggerSitemapUpdate();
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/page-seo/:id error:', err);
    res.status(500).json({ error: 'Failed to delete page SEO entry' });
  }
});

module.exports = router;
module.exports.requireAdmin = requireAdmin;
