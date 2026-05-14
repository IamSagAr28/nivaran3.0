const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// Check if we are using Postgres (Production/Vercel) or SQLite (Local)
const isPostgres = !!process.env.DATABASE_URL;

let db;

if (isPostgres) {
  console.log('🔌 Connecting to PostgreSQL...');
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  initPgDb();
} else {
  console.log('📂 Connecting to local SQLite...');
  const dbPath = path.resolve(__dirname, 'database.sqlite');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening SQLite database:', err.message);
    else {
      console.log(`Connected to SQLite at ${dbPath}`);
      initSqliteDb();
    }
  });
}

// --- Initialization Scripts ---

function initPgDb() {
  const createTables = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      google_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      provider_subscription_id TEXT UNIQUE,
      provider TEXT DEFAULT 'manual',
      status TEXT,
      current_period_start TIMESTAMP,
      current_period_end TIMESTAMP,
      cancel_at_period_end BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      topic TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS membership_submissions (
      id SERIAL PRIMARY KEY,
      plan_title TEXT NOT NULL,
      region TEXT NOT NULL,
      price TEXT NOT NULL,
      full_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      landmark TEXT,
      city TEXT,
      pincode TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      compare_at_price DECIMAL(10,2),
      images TEXT DEFAULT '[]',
      category TEXT,
      material TEXT,
      featured INTEGER DEFAULT 0,
      
      -- Variant information
      -- Top-level stock is for products without variants
      stock INTEGER DEFAULT 0, 
      
      -- Defines the types of variants, e.g., [{"name": "Color"}, {"name": "Size"}]
      variant_types TEXT DEFAULT '[]',

      -- Stores the actual variant combinations, e.g., [{"attributes": {"Color": "Red", "Size": "M"}, "stock": 10, "price": 19.99}]
      variants TEXT DEFAULT '[]',

      -- Legacy columns, to be phased out
      colors TEXT DEFAULT '[]',
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      address TEXT NOT NULL,
      city TEXT,
      state TEXT,
      pincode TEXT,
      items TEXT NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      shipping DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) NOT NULL,
      payment_method TEXT,
      payment_status TEXT,
      payment_order_id TEXT,
      payment_id TEXT,
      payment_signature TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      shiprocket_order_id TEXT,
      shiprocket_shipment_id TEXT,
      shiprocket_awb_code TEXT,
      shiprocket_courier_name TEXT,
      shiprocket_tracking_url TEXT,
      shiprocket_status TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

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
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'subscribed',
      unsubscribe_token TEXT UNIQUE NOT NULL,
      source TEXT,
      ip TEXT,
      user_agent TEXT,
      unsubscribed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hero_slides (
      id SERIAL PRIMARY KEY,
      image TEXT NOT NULL,
      tag TEXT,
      title TEXT,
      highlight TEXT,
      description TEXT,
      primary_cta TEXT,
      secondary_cta TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.query(createTables)
    .then(() => {
      const alterOrders = `
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_awb_code TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_courier_name TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_tracking_url TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_status TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_order_id TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_signature TEXT;
      `;
      return db.query(alterOrders);
    })
    .then(() => {
      const alterSlides = `
        ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS image TEXT;
        ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS tag TEXT;
        ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS title TEXT;
        ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS highlight TEXT;
        ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS primary_cta TEXT;
        ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS secondary_cta TEXT;
        ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
        ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS active INTEGER DEFAULT 1;
      `;
      return db.query(alterSlides);
    })
    .then(() => {
      const alterProducts = `
        ALTER TABLE products ADD COLUMN IF NOT EXISTS variants TEXT DEFAULT '[]';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_types TEXT DEFAULT '[]';
      `;
      return db.query(alterProducts);
    })
    .then(() => {
      console.log('✅ PostgreSQL tables initialized.');
      seedAdminUser();
      seedHeroSlides();
    })
    .catch(err => console.error('❌ Error initializing Postgres tables:', err));
}

function initSqliteDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      google_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      provider_subscription_id TEXT UNIQUE,
      provider TEXT DEFAULT 'manual',
      status TEXT,
      current_period_start DATETIME,
      current_period_end DATETIME,
      cancel_at_period_end BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      topic TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS membership_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_title TEXT NOT NULL,
      region TEXT NOT NULL,
      price TEXT NOT NULL,
      full_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      landmark TEXT,
      city TEXT,
      pincode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      compare_at_price REAL,
      images TEXT DEFAULT '[]',
      category TEXT,
      material TEXT,
      featured INTEGER DEFAULT 0,

      -- Variant information
      stock INTEGER DEFAULT 0, 
      variant_types TEXT DEFAULT '[]',
      variants TEXT DEFAULT '[]',

      -- Legacy
      colors TEXT DEFAULT '[]',

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        // Ensure new columns exist for older SQLite DBs.
        db.all('PRAGMA table_info(products)', (e, cols) => {
          if (!e && Array.isArray(cols)) {
            if (!cols.some(c => c.name === 'variants')) {
              db.run("ALTER TABLE products ADD COLUMN variants TEXT DEFAULT '[]'");
            }
            if (!cols.some(c => c.name === 'variant_types')) {
              db.run("ALTER TABLE products ADD COLUMN variant_types TEXT DEFAULT '[]'");
            }
          }
        });
        seedAdminUser();
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      address TEXT NOT NULL,
      city TEXT,
      state TEXT,
      pincode TEXT,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      shipping REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT,
      payment_status TEXT,
      payment_order_id TEXT,
      payment_id TEXT,
      payment_signature TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'subscribed',
      unsubscribe_token TEXT UNIQUE NOT NULL,
      source TEXT,
      ip TEXT,
      user_agent TEXT,
      unsubscribed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS hero_slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image TEXT NOT NULL,
      tag TEXT,
      title TEXT,
      highlight TEXT,
      description TEXT,
      primary_cta TEXT,
      secondary_cta TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    ensureSqliteColumns('orders', [
      { name: 'shiprocket_order_id', type: 'TEXT' },
      { name: 'shiprocket_shipment_id', type: 'TEXT' },
      { name: 'shiprocket_awb_code', type: 'TEXT' },
      { name: 'shiprocket_courier_name', type: 'TEXT' },
      { name: 'shiprocket_tracking_url', type: 'TEXT' },
      { name: 'shiprocket_status', type: 'TEXT' },
      { name: 'payment_method', type: 'TEXT' },
      { name: 'payment_status', type: 'TEXT' },
      { name: 'payment_order_id', type: 'TEXT' },
      { name: 'payment_id', type: 'TEXT' },
      { name: 'payment_signature', type: 'TEXT' },
    ]);

    ensureSqliteColumns('hero_slides', [
      { name: 'image', type: 'TEXT' },
      { name: 'tag', type: 'TEXT' },
      { name: 'title', type: 'TEXT' },
      { name: 'highlight', type: 'TEXT' },
      { name: 'description', type: 'TEXT' },
      { name: 'primary_cta', type: 'TEXT' },
      { name: 'secondary_cta', type: 'TEXT' },
      { name: 'sort_order', type: 'INTEGER' },
      { name: 'active', type: 'INTEGER' },
    ]);

    console.log('✅ SQLite tables initialized.');
    seedHeroSlides();
  });
}

function seedHeroSlides() {
  const defaults = [
    {
      image: '/images/hero/hero1.jpg',
      tag: 'Sustainable Living Made Beautiful',
      title: 'Transforming Waste into',
      highlight: 'Wonderful Products',
      description: 'Discover our collection of handcrafted, eco-friendly products made from upcycled materials.',
      primary_cta: 'Shop Now',
      secondary_cta: 'Learn More',
      sort_order: 1,
    },
    {
      image: '/images/hero/hero2.jpg',
      tag: 'Handcrafted Excellence',
      title: 'Every Product Tells',
      highlight: 'A Story',
      description: 'Supporting local artisans while promoting environmental consciousness.',
      primary_cta: 'Explore Collection',
      secondary_cta: 'Our Story',
      sort_order: 2,
    },
    {
      image: '/images/hero/hero3.jpg',
      tag: 'Join the Movement',
      title: 'Building a',
      highlight: 'Circular Economy',
      description: 'Each purchase contributes to a sustainable future and empowers local communities.',
      primary_cta: 'Get Started',
      secondary_cta: 'Join Workshop',
      sort_order: 3,
    },
    {
      image: '/images/hero/hero4.jpg',
      tag: 'New Arrivals',
      title: 'Freshly Crafted',
      highlight: 'Just For You',
      description: 'Check out the latest additions to our sustainable collection.',
      primary_cta: 'Shop New',
      secondary_cta: "See What's New",
      sort_order: 4,
    },
    {
      image: '/images/hero/hero5.jpg',
      tag: 'Gifts That Give Back',
      title: 'Meaningful Presents',
      highlight: 'For Every Occasion',
      description: 'Find the perfect eco-friendly gift that makes a difference.',
      primary_cta: 'Browse Gifts',
      secondary_cta: 'Gifting Guide',
      sort_order: 5,
    },
    {
      image: '/images/hero/hero6.jpg',
      tag: 'Our Commitment',
      title: 'Sustainability in',
      highlight: 'Every Stitch',
      description: 'Learn about our process and our dedication to a greener planet.',
      primary_cta: 'Our Process',
      secondary_cta: 'Learn More',
      sort_order: 6,
    },
  ];

  dbWrapper.getAsync('SELECT COUNT(*) as count FROM hero_slides')
    .then((row) => {
      if ((row?.count || 0) > 0) return;
      defaults.forEach((slide) => {
        dbWrapper.run(
          `INSERT INTO hero_slides
            (image, tag, title, highlight, description, primary_cta, secondary_cta, sort_order, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            slide.image,
            slide.tag,
            slide.title,
            slide.highlight,
            slide.description,
            slide.primary_cta,
            slide.secondary_cta,
            slide.sort_order,
          ]
        );
      });
    })
    .catch(() => {});
}

function ensureSqliteColumns(tableName, columns) {
  db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
    if (err) return;
    const existing = new Set(rows.map(r => r.name));
    columns.forEach((col) => {
      if (!existing.has(col.name)) {
        db.run(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type}`);
      }
    });
  });
}

// Seed default admin user (admin / nivara@admin123)
function seedAdminUser() {
  const bcrypt = require('bcryptjs');
  const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'nivara@admin123';
  
  dbWrapper.get('SELECT id FROM admin_users WHERE username = ?', [defaultUsername], (err, row) => {
    if (err || row) return; // Already exists or error
    const hash = bcrypt.hashSync(defaultPassword, 10);
    dbWrapper.run(
      'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
      [defaultUsername, hash],
      (err2) => {
        if (!err2) console.log(`✅ Default admin user created: ${defaultUsername}`);
      }
    );
  });
}

// --- Unified Interface Wrapper ---
const dbWrapper = {
  run: (sql, params = [], callback) => {
    if (isPostgres) {
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      db.query(pgSql, params)
        .then(res => {
          const context = { lastID: 0, changes: res.rowCount };
          if (callback) callback.call(context, null);
        })
        .catch(err => {
          if (callback) callback(err);
        });
    } else {
      db.run(sql, params, callback);
    }
  },

  get: (sql, params = [], callback) => {
    if (isPostgres) {
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      db.query(pgSql, params)
        .then(res => {
          if (callback) callback(null, res.rows[0]);
        })
        .catch(err => {
          if (callback) callback(err);
        });
    } else {
      db.get(sql, params, callback);
    }
  },

  all: (sql, params = [], callback) => {
    if (isPostgres) {
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      db.query(pgSql, params)
        .then(res => {
          if (callback) callback(null, res.rows);
        })
        .catch(err => {
          if (callback) callback(err);
        });
    } else {
      db.all(sql, params, callback);
    }
  },

  // Promise-based run (for convenience)
  runAsync: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      dbWrapper.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this ? this.lastID : 0, changes: this ? this.changes : 0 });
      });
    });
  },

  getAsync: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      dbWrapper.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  allAsync: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      dbWrapper.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
};

module.exports = dbWrapper;
