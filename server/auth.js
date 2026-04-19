const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const db = require('./database');
const { findOrCreateCustomer, createCustomer } = require('./shopify');
const router = express.Router();

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'; // Frontend URL

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  // Silent when google oauth is disabled
}

const client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Helper: Find or Create Local User
function findOrCreateLocalUser(email, googleId, shopifyId, firstName, lastName) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) return reject(err);
      if (row) {
        // Update existing user with missing IDs if needed
        if ((googleId && !row.google_id) || (shopifyId && !row.shopify_customer_id)) {
          db.run(
            'UPDATE users SET google_id = COALESCE(?, google_id), shopify_customer_id = COALESCE(?, shopify_customer_id) WHERE id = ?',
            [googleId, shopifyId, row.id],
            (err) => {
              if (err) console.error('Error updating user IDs:', err);
            }
          );
        }
        return resolve(row);
      }

      // Create new user
      db.run(
        'INSERT INTO users (email, google_id, shopify_customer_id, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
        [email, googleId, shopifyId, firstName, lastName],
        function (err) {
          if (err) return reject(err);
          // Handle lastID for both SQLite (this.lastID) and Postgres (handled in wrapper)
          const newId = this.lastID || 0;
          // Note: If Postgres wrapper doesn't return ID, we might need to fetch user by email again
          if (newId === 0) {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, newUser) => {
              if (err) return reject(err);
              console.log(`✅ New Google User Created: ${email} (ID: ${newUser.id})`);
              resolve(newUser);
            });
          } else {
            console.log(`✅ New Google User Created: ${email} (ID: ${newId})`);
            resolve({ id: newId, email, google_id: googleId, shopify_customer_id: shopifyId, first_name: firstName, last_name: lastName });
          }
        }
      );
    });
  });
}

/**
 * POST /auth/signup
 * Local email/password signup
 */
router.post('/signup', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Check if user exists locally
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (row) return res.status(400).json({ error: 'User already exists' });

      // 2. Create Shopify Customer
      let shopifyCustomer;
      try {
        shopifyCustomer = await createCustomer({ firstName, lastName, email });
      } catch (shopifyErr) {
        console.error('Shopify creation failed, proceeding with local only:', shopifyErr.message);
      }

      // 3. Hash Password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4. Create Local User
      db.run(
        'INSERT INTO users (email, password_hash, first_name, last_name, shopify_customer_id) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, firstName, lastName, shopifyCustomer?.id],
        function (err) {
          if (err) return res.status(500).json({ error: 'Failed to create user' });

          // Handle ID retrieval for both DB types
          const finalizeUser = (id) => {
            const user = {
              id: id,
              email,
              firstName,
              lastName,
              shopifyCustomerId: shopifyCustomer?.id
            };
            console.log(`✅ New User Registered: ${email} (ID: ${id})`); // Log for visibility
            req.session.user = user;
            res.status(201).json({ message: 'User created', user });
          };

          if (this.lastID) {
            finalizeUser(this.lastID);
          } else {
            // Fetch user again to get ID (Postgres fallback)
            db.get('SELECT id FROM users WHERE email = ?', [email], (err, newUser) => {
              if (err || !newUser) return res.status(500).json({ error: 'User creation verification failed' });
              finalizeUser(newUser.id);
            });
          }
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /auth/login
 * Local email/password login
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      shopifyCustomerId: user.shopify_customer_id
    };

    res.json({ message: 'Logged in', user: req.session.user });
  });
});

/**
 * GET /auth/google
 * Initiates the Google OAuth flow.
 */
router.get('/google', (req, res) => {
  // Ensure we have a redirect URI set
  if (!GOOGLE_REDIRECT_URI) {
    console.error('❌ GOOGLE_REDIRECT_URI is missing. Cannot start OAuth flow.');
    return res.status(500).send('Server misconfiguration: GOOGLE_REDIRECT_URI is missing');
  }

  // Store the return URL (referer) in session so we redirect back to the correct frontend
  if (req.headers.referer) {
    try {
      const url = new URL(req.headers.referer);
      req.session.returnTo = url.origin;
    } catch (e) {
      req.session.returnTo = req.headers.referer;
    }
  } else {
    req.session.returnTo = CLIENT_URL;
  }

  const authorizeUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
    // Force an explicit redirect_uri param to be used in the request
    redirect_uri: GOOGLE_REDIRECT_URI,
  });
  const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production';
  if (DEBUG) {
    console.log('[DEBUG] Google authorizeUrl:', authorizeUrl);
  }
  res.redirect(authorizeUrl);
});

// Dev-only debug route: show non-secret config values for quick verification
if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
  router.get('/debug', (req, res) => {
    return res.json({
      google_client_id: process.env.GOOGLE_CLIENT_ID || null,
      google_redirect_uri: process.env.GOOGLE_REDIRECT_URI || null,
      client_url: process.env.CLIENT_URL || 'http://localhost:5173',
      node_env: process.env.NODE_ENV || 'development',
    });
  });
}

/**
 * GET /auth/google/callback
 * Handles the callback from Google, exchanges code for tokens,
 * verifies ID token, syncs with Shopify, and sets session.
 */
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing auth code');
  }

  try {
    // 1. Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // 2. Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // payload contains: email, email_verified, name, picture, given_name, family_name
    if (!payload.email_verified) {
      return res.status(403).send('Email not verified by Google');
    }

    // 3. Find or Create Shopify Customer (Non-fatal)
    let shopifyCustomer = { id: null };
    try {
      if (typeof findOrCreateCustomer === 'function') {
        shopifyCustomer = await findOrCreateCustomer(payload);
      }
    } catch (shopifyErr) {
      console.warn('⚠️ Shopify sync failed (Login proceeding anyway):', shopifyErr.message);
      // Proceed without Shopify ID
    }

    // 4. Find or Create Local User
    const localUser = await findOrCreateLocalUser(
      payload.email,
      payload.sub,
      shopifyCustomer?.id || null,
      payload.given_name,
      payload.family_name
    );

    // 5. Create Session
    req.session.user = {
      id: localUser.id,
      email: localUser.email,
      firstName: localUser.first_name,
      lastName: localUser.last_name,
      googleId: localUser.google_id,
      picture: payload.picture,
      shopifyCustomerId: localUser.shopify_customer_id
    };

    // 6. Redirect back to frontend (Dynamic)
    const returnTo = req.session.returnTo || CLIENT_URL;
    delete req.session.returnTo;

    res.redirect(`${returnTo}/?login=success`);

  } catch (error) {
    console.error('OAuth Error:', error);
    res.redirect(`${CLIENT_URL}/login?error=auth_failed`);
  }
});

/**
 * GET /auth/logout
 * Clears the session.
 */
router.get('/logout', (req, res) => {
  req.session = null;
  res.status(200).json({ message: 'Logged out successfully' });
});

/**
 * GET /api/me
 * Returns the currently logged-in user.
 */
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ authenticated: false });
  }

  // Fetch latest subscription status
  db.get(
    `SELECT status, current_period_end FROM subscriptions 
     WHERE user_id = ? AND status IN ('active', 'trialing') 
     ORDER BY created_at DESC LIMIT 1`,
    [req.session.user.id],
    (err, sub) => {
      res.json({
        authenticated: true,
        user: req.session.user,
        subscription: sub || null
      });
    }
  );
});

/**
 * PUT /api/profile
 * Updates the user's profile information.
 */
router.put('/profile', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { firstName, lastName, email, phone } = req.body;
  const userId = req.session.user.id;

  // Update user in database
  db.run(
    'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?',
    [firstName, lastName, email, phone, userId],
    function (err) {
      if (err) {
        console.error('Profile update error:', err);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      // Update session with new data
      req.session.user = {
        ...req.session.user,
        firstName,
        lastName,
        email,
        phone
      };

      res.json({
        message: 'Profile updated successfully',
        user: req.session.user
      });
    }
  );
});

module.exports = router;
