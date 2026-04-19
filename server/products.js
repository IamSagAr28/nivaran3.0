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
  };
}

// GET /api/products — list all (public)
router.get('/', async (req, res) => {
  try {
    const { category, featured, search, sort = 'newest', limit, offset } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
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
