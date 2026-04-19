const express = require('express');
const router = express.Router();
const db = require('./database');

// --- Admin Auth Middleware ---
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    if (token === req.session?.adminToken) return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
}

// Ensure table exists (SQLite + Postgres)
async function ensureBlogsTable() {
  try {
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        handle TEXT UNIQUE NOT NULL,
        image_url TEXT,
        image_alt TEXT,
        current_author TEXT DEFAULT 'Nivaran',
        excerpt TEXT,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    try {
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS blogs (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          handle TEXT UNIQUE NOT NULL,
          image_url TEXT,
          image_alt TEXT,
          current_author TEXT DEFAULT 'Nivaran',
          excerpt TEXT,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e2) {
      // If it fails here, endpoints will error; log once.
      console.error('Failed to ensure blogs table:', e2);
    }
  }
}

function formatBlog(row) {
  return {
    id: 'gid://shopify/Article/' + row.id,
    title: row.title,
    handle: row.handle,
    publishedAt: row.created_at,
    excerpt: row.excerpt || '',
    content: row.content || '',
    contentHtml: row.content || '',
    image: row.image_url ? { url: row.image_url, altText: row.image_alt || row.title } : undefined,
    authorV2: { name: row.current_author || 'Nivaran' },
    blog: { handle: 'news', title: 'News' },
  };
}

async function seedDefaultBlogsIfEmpty() {
  try {
    const countRow = await db.getAsync('SELECT COUNT(*) as cnt FROM blogs');
    const cnt = countRow?.cnt ?? countRow?.count ?? 0;
    if (Number(cnt) > 0) return;

    const seed = [
      {
        title: 'Sustainable Living: Transform Your Home',
        handle: 'sustainable-living-transform-home',
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=1000',
        image_alt: 'Sustainable living',
        current_author: 'Nivaran',
        excerpt: 'Discover how upcycled products can transform your living space into an eco-friendly haven. Learn practical tips for sustainable home decor.',
        content: '<p>Discover how upcycled products can transform your living space into an eco-friendly haven. Learn practical tips for sustainable home decor.</p>',
      },
      {
        title: 'The Art of Upcycling: Creative Techniques',
        handle: 'art-of-upcycling-techniques',
        image_url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&q=80&w=1000',
        image_alt: 'Upcycling techniques',
        current_author: 'Nivaran',
        excerpt: 'Explore the creative world of upcycling and learn techniques to turn waste materials into beautiful, functional art pieces for your home.',
        content: '<p>Explore the creative world of upcycling and learn techniques to turn waste materials into beautiful, functional art pieces for your home.</p>',
      },
      {
        title: 'Community Impact: Stories of Change',
        handle: 'community-impact-stories',
        image_url: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&q=80&w=1000',
        image_alt: 'Community impact',
        current_author: 'Nivaran',
        excerpt: 'Read inspiring stories from our community members who have embraced sustainable living and made a positive impact on the environment.',
        content: '<p>Read inspiring stories from our community members who have embraced sustainable living and made a positive impact on the environment.</p>',
      },
    ];

    for (const b of seed) {
      await db.runAsync(
        'INSERT INTO blogs (title, handle, image_url, image_alt, current_author, excerpt, content) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [b.title, b.handle, b.image_url, b.image_alt, b.current_author, b.excerpt, b.content]
      );
    }

    console.log('✅ Seeded default blog posts');
  } catch (e) {
    console.error('Failed to seed default blogs:', e);
  }
}

// Run once on module load
ensureBlogsTable().then(seedDefaultBlogsIfEmpty);

// Public: list
router.get('/', async (req, res) => {
  try {
    const { limit } = req.query;
    let sql = 'SELECT * FROM blogs ORDER BY created_at DESC';
    const params = [];

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit, 10));
    }

    const rows = await db.allAsync(sql, params);
    res.json(rows.map(formatBlog));
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.json([]);
  }
});

// Public: get single by handle
router.get('/article/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const row = await db.getAsync('SELECT * FROM blogs WHERE handle = ? LIMIT 1', [handle]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(formatBlog(row));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

// Admin: list raw
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const rows = await db.allAsync('SELECT * FROM blogs ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create
router.post('/admin', requireAdmin, async (req, res) => {
  try {
    const { title, handle, image_url, image_alt, current_author, excerpt, content } = req.body;
    if (!title || !handle || !content) {
      return res.status(400).json({ error: 'title, handle, and content are required' });
    }

    const result = await db.runAsync(
      'INSERT INTO blogs (title, handle, image_url, image_alt, current_author, excerpt, content) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, handle, image_url || null, image_alt || null, current_author || 'Nivaran', excerpt || '', content]
    );
    return res.status(201).json({ success: true, id: result?.lastID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: update
router.put('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { title, handle, image_url, image_alt, current_author, excerpt, content } = req.body;
    const { id } = req.params;

    await db.runAsync(
      'UPDATE blogs SET title=?, handle=?, image_url=?, image_alt=?, current_author=?, excerpt=?, content=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [title, handle, image_url || null, image_alt || null, current_author || 'Nivaran', excerpt || '', content, id]
    );
    return res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: delete
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.runAsync('DELETE FROM blogs WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
