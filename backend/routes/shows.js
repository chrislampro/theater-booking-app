// backend/routes/shows.js
const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/shows - Get all shows with filters
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { q, theatreId, date } = req.query;
    let query = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.duration,
        s.age_rating,
        s.genre,
        t.theatre_id,
        t.name as theatre_name,
        t.location,
        st.showtime_id,
        st.show_date,
        st.show_time,
        st.price,
        st.available_seats,
        (SELECT COUNT(*) FROM seats WHERE show_id = s.id) as total_seats
      FROM shows s
      JOIN theatres t ON s.theatre_id = t.theatre_id
      JOIN showtimes st ON st.show_id = s.id
      WHERE st.show_date >= CURDATE()
    `;
    
    const params = [];
    
    if (q) {
      query += ` AND (s.title LIKE ? OR t.name LIKE ? OR t.location LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (theatreId) {
      query += ` AND t.theatre_id = ?`;
      params.push(theatreId);
    }
    if (date) {
      query += ` AND st.show_date = ?`;
      params.push(date);
    }
    
    query += ` ORDER BY st.show_date ASC, st.show_time ASC`;
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { 
    next(err); 
  }
});

// GET /api/shows/:id - Get single show details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.*,
        t.name as theatre_name,
        t.location,
        t.description as theatre_description,
        GROUP_CONCAT(DISTINCT tf.facility_name) as facilities
      FROM shows s
      JOIN theatres t ON s.theatre_id = t.theatre_id
      LEFT JOIN theatre_facilities tf ON tf.theatre_id = t.theatre_id
      WHERE s.id = ?
      GROUP BY s.id
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Show not found' });
    }
    res.json(rows[0]);
  } catch (err) { 
    next(err); 
  }
});

// GET /api/shows/:id/seats - Get seat map with categories
router.get('/:id/seats', authenticate, async (req, res, next) => {
  try {
    const showId = req.params.id;
    const [rows] = await db.query(`
      SELECT
        se.id,
        se.show_id,
        se.row_label,
        se.seat_number,
        COALESCE(se.category, 'standard') as category,
        COALESCE(se.price_multiplier, 1.00) as price_multiplier,
        CASE 
          WHEN bs.id IS NOT NULL THEN 'booked'
          ELSE 'available'
        END as status,
        ROUND(st.price * COALESCE(se.price_multiplier, 1.00), 2) as calculated_price
      FROM seats se
      JOIN shows s ON s.id = se.show_id
      JOIN showtimes st ON st.show_id = s.id
      LEFT JOIN booking_seats bs ON bs.seat_id = se.id
        AND bs.booking_id IN (
          SELECT id FROM bookings WHERE show_id = ? AND status = 'confirmed'
        )
      WHERE se.show_id = ?
      GROUP BY se.id, se.row_label, se.seat_number, se.category, se.price_multiplier, bs.id
      ORDER BY se.row_label, se.seat_number
    `, [showId, showId]);
    res.json(rows);
  } catch (err) { 
    next(err); 
  }
});

// GET /api/theatres - Get all theatres
router.get('/theatres/list', authenticate, async (req, res, next) => {
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

module.exports = router;