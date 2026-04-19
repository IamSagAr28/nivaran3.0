const express = require('express');
const router = express.Router();
const db = require('./database');
const { requireAdmin } = require('./admin');

// Public: Get active hero slides
router.get('/', async (req, res) => {
  try {
    const rows = await db.allAsync(
      'SELECT * FROM hero_slides WHERE active = 1 ORDER BY sort_order ASC, id ASC'
    );
    res.json({ slides: rows || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

// Admin: Get all slides
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const rows = await db.allAsync('SELECT * FROM hero_slides ORDER BY sort_order ASC, id ASC');
    res.json({ slides: rows || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

// Admin: Create slide
router.post('/admin', requireAdmin, async (req, res) => {
  const {
    image,
    tag,
    title,
    highlight,
    description,
    primary_cta,
    secondary_cta,
    sort_order,
    active,
  } = req.body;

  if (!image) return res.status(400).json({ error: 'Image is required' });

  try {
    await db.runAsync(
      `INSERT INTO hero_slides
        (image, tag, title, highlight, description, primary_cta, secondary_cta, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        image,
        tag || '',
        title || '',
        highlight || '',
        description || '',
        primary_cta || '',
        secondary_cta || '',
        parseInt(sort_order) || 0,
        active ? 1 : 0,
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create hero slide' });
  }
});

// Admin: Update slide
router.put('/admin/:id', requireAdmin, async (req, res) => {
  const {
    image,
    tag,
    title,
    highlight,
    description,
    primary_cta,
    secondary_cta,
    sort_order,
    active,
  } = req.body;

  try {
    await db.runAsync(
      `UPDATE hero_slides SET
        image = ?,
        tag = ?,
        title = ?,
        highlight = ?,
        description = ?,
        primary_cta = ?,
        secondary_cta = ?,
        sort_order = ?,
        active = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        image,
        tag || '',
        title || '',
        highlight || '',
        description || '',
        primary_cta || '',
        secondary_cta || '',
        parseInt(sort_order) || 0,
        active ? 1 : 0,
        req.params.id,
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update hero slide' });
  }
});

// Admin: Delete slide
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    await db.runAsync('DELETE FROM hero_slides WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete hero slide' });
  }
});

module.exports = router;
