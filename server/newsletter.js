const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const db = require('./database');
const router = express.Router();
const { verifyAdminToken } = require('./utils/adminToken');

const BREVO_API_KEY = (process.env.BREVO_API_KEY || '').trim();
const BREVO_LIST_ID_RAW = (process.env.BREVO_LIST_ID || '').toString().trim();
const BREVO_LIST_ID = BREVO_LIST_ID_RAW ? Number.parseInt(BREVO_LIST_ID_RAW, 10) : null;

function brevoHeaders() {
    return {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
    };
}

async function brevoUpsertContact(email) {
    if (!BREVO_API_KEY) return;

    try {
        const payload = {
            email,
            updateEnabled: true,
        };

        if (Number.isFinite(BREVO_LIST_ID) && BREVO_LIST_ID) {
            payload.listIds = [BREVO_LIST_ID];
        }

        await axios.post('https://api.brevo.com/v3/contacts', payload, {
            headers: brevoHeaders(),
            timeout: 4000,
        });
    } catch (e) {
        // Do not fail the newsletter subscribe flow if ESP is down/misconfigured.
        const status = e?.response?.status;
        const data = e?.response?.data;
        console.error('Brevo upsert failed:', status || e?.message, data || '');
    }
}

async function brevoRemoveFromList(email) {
    if (!BREVO_API_KEY) return;
    if (!Number.isFinite(BREVO_LIST_ID) || !BREVO_LIST_ID) return;

    try {
        await axios.post(
            `https://api.brevo.com/v3/contacts/lists/${BREVO_LIST_ID}/contacts/remove`,
            { emails: [email] },
            { headers: brevoHeaders(), timeout: 4000 }
        );
    } catch (e) {
        const status = e?.response?.status;
        const data = e?.response?.data;
        console.error('Brevo remove-from-list failed:', status || e?.message, data || '');
    }
}

// --- Settings storage (SQLite + Postgres) ---
async function ensureSiteSettingsTable() {
    try {
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS site_settings (
                setting_key TEXT PRIMARY KEY,
                setting_value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (e) {
        try {
            await db.runAsync(`
                CREATE TABLE IF NOT EXISTS site_settings (
                    setting_key TEXT PRIMARY KEY,
                    setting_value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch (e2) {
            console.error('Failed to ensure site_settings table:', e2);
        }
    }
}

async function getNewsletterDiscountCode() {
    const envCode = (process.env.NEWSLETTER_DISCOUNT_CODE || '').trim();
    try {
        await ensureSiteSettingsTable();
        const row = await db.getAsync(
            'SELECT setting_value FROM site_settings WHERE setting_key = ?',
            ['newsletter_discount_code']
        );

        // If an admin has explicitly set the value (even to empty), prefer DB over env.
        if (row && Object.prototype.hasOwnProperty.call(row, 'setting_value')) {
            return (row.setting_value ?? '').toString().trim();
        }

        return envCode;
    } catch (e) {
        return envCode;
    }
}

// Ensure table exists (SQLite + Postgres)
async function ensureNewsletterTable() {
    try {
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
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
            )
        `);
    } catch (e) {
        try {
            await db.runAsync(`
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
                )
            `);
        } catch (e2) {
            console.error('Failed to ensure newsletter_subscribers table:', e2);
        }
    }
}

/**
 * POST /api/newsletter/subscribe
 * Subscribe an email to the newsletter (local DB)
 */
router.post('/subscribe', async (req, res) => {
    const rawEmail = (req.body?.email || '').toString();
    const email = rawEmail.trim().toLowerCase();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
        return res.status(400).json({ success: false, error: 'Valid email address is required' });
    }

    try {
        await ensureNewsletterTable();

        const existing = await db.getAsync(
            'SELECT id, status, unsubscribe_token FROM newsletter_subscribers WHERE email = ?',
            [email]
        );

        const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString();
        const userAgent = (req.headers['user-agent'] || '').toString();
        const source = (req.body?.source || 'website').toString();

        if (!existing) {
            const unsubscribeToken = crypto.randomBytes(24).toString('hex');
            await db.runAsync(
                `INSERT INTO newsletter_subscribers
                    (email, status, unsubscribe_token, source, ip, user_agent)
                 VALUES (?, 'subscribed', ?, ?, ?, ?)`
                ,
                [email, unsubscribeToken, source, ip, userAgent]
            );

            const discountCode = await getNewsletterDiscountCode();

            await brevoUpsertContact(email);

            return res.status(200).json({
                success: true,
                isNew: true,
                message: discountCode
                    ? `Thanks for subscribing! Your 10% code: ${discountCode}`
                    : 'Thanks for subscribing! You will now receive updates from us.',
                discountCode: discountCode || undefined,
            });
        }

        // Resubscribe if previously unsubscribed
        if ((existing.status || '').toLowerCase() !== 'subscribed') {
            await db.runAsync(
                `UPDATE newsletter_subscribers
                 SET status = 'subscribed', unsubscribed_at = NULL, updated_at = CURRENT_TIMESTAMP,
                         source = ?, ip = ?, user_agent = ?
                 WHERE id = ?`,
                [source, ip, userAgent, existing.id]
            );

            const discountCode = await getNewsletterDiscountCode();

            await brevoUpsertContact(email);
            return res.status(200).json({
                success: true,
                isNew: false,
                message: discountCode
                    ? `Welcome back — you are subscribed again. Your 10% code: ${discountCode}`
                    : 'Welcome back — you are subscribed again.',
                discountCode: discountCode || undefined,
            });
        }

    const discountCode = await getNewsletterDiscountCode();

        await brevoUpsertContact(email);

        return res.status(200).json({
            success: true,
            isNew: false,
            message: discountCode
                ? `You're already subscribed. Your 10% code: ${discountCode}`
                : "You're already subscribed.",
            discountCode: discountCode || undefined,
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return res.status(500).json({ success: false, error: 'An error occurred. Please try again later.' });
    }
});

/**
 * GET /api/newsletter/unsubscribe?token=...
 * Unsubscribe via token (browser-friendly)
 */
router.get('/unsubscribe', async (req, res) => {
    const token = (req.query?.token || '').toString().trim();
    if (!token) return res.status(400).send('Missing token');

    try {
        await ensureNewsletterTable();
        const row = await db.getAsync(
            'SELECT id, email, status FROM newsletter_subscribers WHERE unsubscribe_token = ?',
            [token]
        );

        if (!row) return res.status(404).send('Invalid unsubscribe link');

        if ((row.status || '').toLowerCase() !== 'unsubscribed') {
            await db.runAsync(
                `UPDATE newsletter_subscribers
                 SET status = 'unsubscribed', unsubscribed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [row.id]
            );

            // Optional: keep Brevo list in sync by removing unsubscribed contact.
            await brevoRemoveFromList(String(row.email || '').toLowerCase());
        }

        const homeUrl = process.env.FRONTEND_URL || '/';
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(`<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Unsubscribed</title>
        <style>
            body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:32px;background:#f8fafc;color:#0f172a}
            .card{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px}
            a{color:#2563eb}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>You are unsubscribed</h2>
            <p>${String(row.email || '')} will no longer receive newsletter emails.</p>
            <p><a href="${homeUrl}">Return to website</a></p>
        </div>
    </body>
</html>`);
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        return res.status(500).send('An error occurred. Please try again later.');
    }
});

// --- Admin Auth Middleware (same logic as other admin routes) ---
function requireAdmin(req, res, next) {
    if (req.session && req.session.adminId) return next();
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

/**
 * GET /api/newsletter/admin/settings
 * Read newsletter settings (currently discount code)
 */
router.get('/admin/settings', requireAdmin, async (req, res) => {
    try {
        await ensureSiteSettingsTable();
        const row = await db.getAsync(
            'SELECT setting_value, updated_at FROM site_settings WHERE setting_key = ?',
            ['newsletter_discount_code']
        );

        if (row) {
            return res.json({
                newsletterDiscountCode: (row.setting_value ?? '').toString(),
                updatedAt: row.updated_at || null,
                source: 'db',
            });
        }

        return res.json({
            newsletterDiscountCode: (process.env.NEWSLETTER_DISCOUNT_CODE || '').toString(),
            updatedAt: null,
            source: 'env',
        });
    } catch (error) {
        console.error('Newsletter admin settings error:', error);
        return res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

/**
 * POST /api/newsletter/admin/settings
 * Update newsletter settings (currently discount code)
 */
router.post('/admin/settings', requireAdmin, async (req, res) => {
    try {
        await ensureSiteSettingsTable();

        const raw = req.body?.newsletterDiscountCode;
        const value = (raw ?? '').toString().trim();

        if (value.length > 64) {
            return res.status(400).json({ error: 'Discount code is too long' });
        }

        await db.runAsync(
            `INSERT INTO site_settings (setting_key, setting_value, updated_at)
             VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(setting_key) DO UPDATE SET
               setting_value = excluded.setting_value,
               updated_at = CURRENT_TIMESTAMP`,
            ['newsletter_discount_code', value]
        );

        return res.json({ success: true, newsletterDiscountCode: value });
    } catch (error) {
        console.error('Newsletter admin update settings error:', error);
        return res.status(500).json({ error: 'Failed to update settings' });
    }
});

/**
 * GET /api/newsletter/admin/subscribers
 */
router.get('/admin/subscribers', requireAdmin, async (req, res) => {
    try {
        await ensureNewsletterTable();
        const q = (req.query?.q || '').toString().trim().toLowerCase();
        const status = (req.query?.status || '').toString().trim().toLowerCase();
        const limit = Math.min(parseInt((req.query?.limit || '200').toString(), 10) || 200, 1000);
        const offset = parseInt((req.query?.offset || '0').toString(), 10) || 0;

        const where = [];
        const params = [];

        if (q) {
            where.push('LOWER(email) LIKE ?');
            params.push(`%${q}%`);
        }
        if (status === 'subscribed' || status === 'unsubscribed') {
            where.push('LOWER(status) = ?');
            params.push(status);
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const rows = await db.allAsync(
            `SELECT id, email, status, source, created_at, updated_at, unsubscribed_at
             FROM newsletter_subscribers
             ${whereSql}
             ORDER BY created_at DESC
             LIMIT ${limit} OFFSET ${offset}`,
            params
        );
        res.json({ data: rows });
    } catch (error) {
        console.error('Newsletter admin list error:', error);
        res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
});

/**
 * GET /api/newsletter/admin/export.csv
 */
router.get('/admin/export.csv', requireAdmin, async (req, res) => {
    try {
        await ensureNewsletterTable();
        const rows = await db.allAsync(
            `SELECT email, status, source, created_at, unsubscribed_at
             FROM newsletter_subscribers
             ORDER BY created_at DESC`
        );

        const escapeCsv = (value) => {
            const s = (value ?? '').toString();
            if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };

        const header = ['email', 'status', 'source', 'created_at', 'unsubscribed_at'];
        const lines = [header.join(',')];
        for (const r of rows) {
            lines.push(
                [r.email, r.status, r.source, r.created_at, r.unsubscribed_at].map(escapeCsv).join(',')
            );
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"');
        res.status(200).send(lines.join('\n'));
    } catch (error) {
        console.error('Newsletter export error:', error);
        res.status(500).json({ error: 'Failed to export subscribers' });
    }
});

module.exports = router;
