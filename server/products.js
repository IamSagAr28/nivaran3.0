const express = require('express');
const router = express.Router();
const db = require('./database');

// Helper: parse JSON fields safely
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
  };
}

// GET /api/products — list all (public)
router.get('/', async (req, res) => {
  try {
    const { category, featured, search, sort = 'newest', limit, offset, includeImages } = req.query;
    const withImages = includeImages === '1' || includeImages === 'true';
      const selectCols = withImages
        ? '*'
        : 'id, title, description, price, compare_at_price, category, colors, variants, material, stock, featured, created_at, updated_at';

    let sql = `SELECT ${selectCols} FROM products WHERE 1=1`;
    const params = [];

    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (featured === 'true') {
      sql += ' AND featured = 1';
    }
    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ? OR material LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    if (sort === 'price_asc') sql += ' ORDER BY price ASC';
    else if (sort === 'price_desc') sql += ' ORDER BY price DESC';
    else sql += ' ORDER BY created_at DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    if (offset) {
      sql += ' OFFSET ?';
      params.push(parseInt(offset));
    }

    const rows = await db.allAsync(sql, params);
    res.json({ products: rows.map(parseProduct) });
  } catch (err) {
    console.error('GET /api/products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/categories — get unique categories
router.get('/categories', async (req, res) => {
  try {
    const rows = await db.allAsync('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category');
    const categories = rows.map(r => r.category).filter(Boolean);
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/products/:id/media/:index — serve a single media item (public)
// This avoids sending huge base64 blobs inside the products list response.
router.get('/:id/media/:index', async (req, res) => {
  try {
    const id = req.params.id;
    const index = Number.parseInt(req.params.index, 10);
    if (!Number.isInteger(index) || index < 0) {
      return res.status(400).json({ error: 'Invalid media index' });
    }

    const row = await db.getAsync('SELECT images FROM products WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Product not found' });

    let images = [];
    if (typeof row.images === 'string') {
      try {
        images = JSON.parse(row.images || '[]');
      } catch {
        images = [];
      }
    } else if (Array.isArray(row.images)) {
      images = row.images;
    }

    const value = images[index];
    if (typeof value !== 'string' || !value) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // If it's an external URL, redirect.
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return res.redirect(302, value);
    }

    // If it's a data URL, decode base64 and serve bytes.
    if (value.startsWith('data:')) {
      const match = value.match(/^data:([^;]+);base64,(.*)$/);
      if (!match) return res.status(400).json({ error: 'Unsupported data URL format' });
      const mime = match[1] || 'application/octet-stream';
      const base64 = match[2] || '';
      const buffer = Buffer.from(base64, 'base64');

      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(buffer);
    }

    return res.status(404).json({ error: 'Media not found' });
  } catch (err) {
    console.error('GET /api/products/:id/media/:index error:', err);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// GET /api/products/:id — single product (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await db.getAsync('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(parseProduct(product));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;
