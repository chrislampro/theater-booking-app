// backend/routes/theatres.js
const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/theatres - Get all theatres
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.*,
        COUNT(DISTINCT s.id) as show_count,
        GROUP_CONCAT(DISTINCT tf.facility_name) as facilities
      FROM theatres t
      LEFT JOIN shows s ON s.theatre_id = t.theatre_id
      LEFT JOIN theatre_facilities tf ON tf.theatre_id = t.theatre_id
      GROUP BY t.theatre_id
      ORDER BY t.name
    `);
    res.json(rows);
  } catch (err) { 
    next(err); 
  }
});

// GET /api/theatres/:id - Get single theatre details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    // Get theatre details
    const [theatre] = await db.query(`
      SELECT 
        t.*,
        GROUP_CONCAT(DISTINCT tf.facility_name SEPARATOR ', ') as facilities
      FROM theatres t
      LEFT JOIN theatre_facilities tf ON tf.theatre_id = t.theatre_id
      WHERE t.theatre_id = ?
      GROUP BY t.theatre_id
    `, [req.params.id]);
    
    if (theatre.length === 0) {
      return res.status(404).json({ message: 'Theatre not found' });
    }
    
    // Get shows for this theatre
    const [shows] = await db.query(`
      SELECT 
        s.id as show_id,
        s.title,
        s.genre,
        s.duration,
        s.description,
        s.age_rating
      FROM shows s
      WHERE s.theatre_id = ?
    `, [req.params.id]);
    
    // Combine the data
    const result = {
      ...theatre[0],
      shows: shows
    };
    
    res.json(result);
  } catch (err) { 
    next(err); 
  }
});

module.exports = router;