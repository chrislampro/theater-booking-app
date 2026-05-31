// backend/routes/showtimes.js
const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/showtimes - Get all showtimes with filters
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { show_id, date, theatre_id } = req.query;
    
    let query = `
      SELECT 
        st.showtime_id,
        st.show_id,
        s.title as show_title,
        s.genre,
        s.duration,
        t.theatre_id,
        t.name as theatre_name,
        t.location,
        st.show_date,
        st.show_time,
        st.price,
        st.available_seats,
        (SELECT COUNT(*) FROM seats WHERE show_id = s.id) as total_seats
      FROM showtimes st
      JOIN shows s ON st.show_id = s.id
      JOIN theatres t ON s.theatre_id = t.theatre_id
      WHERE st.show_date >= CURDATE()
    `;
    
    const params = [];
    
    if (show_id) {
      query += ` AND st.show_id = ?`;
      params.push(show_id);
    }
    if (date) {
      query += ` AND st.show_date = ?`;
      params.push(date);
    }
    if (theatre_id) {
      query += ` AND t.theatre_id = ?`;
      params.push(theatre_id);
    }
    
    query += ` ORDER BY st.show_date ASC, st.show_time ASC`;
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { 
    next(err); 
  }
});

// GET /api/showtimes/:id/seats - Get seats for specific showtime
router.get('/:id/seats', authenticate, async (req, res, next) => {
  try {
    const showtimeId = req.params.id;
    
    // First get showtime info
    const [[showtime]] = await db.query(`
      SELECT st.*, s.id as show_id, s.title
      FROM showtimes st
      JOIN shows s ON st.show_id = s.id
      WHERE st.showtime_id = ?
    `, [showtimeId]);
    
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }
    
    // Then get seats with booking status
    const [seats] = await db.query(`
      SELECT
        se.id,
        se.show_id,
        se.row_label,
        se.seat_number,
        se.category,
        se.price_multiplier,
        CASE 
          WHEN bs.id IS NOT NULL THEN 'booked'
          ELSE 'available'
        END as status,
        ROUND(st.price * se.price_multiplier, 2) as calculated_price
      FROM seats se
      JOIN shows s ON s.id = se.show_id
      JOIN showtimes st ON st.show_id = s.id
      LEFT JOIN booking_seats bs ON bs.seat_id = se.id
        AND bs.booking_id IN (
          SELECT b.id FROM bookings b 
          WHERE b.showtime_id = ? AND b.status = 'confirmed'
        )
      WHERE st.showtime_id = ? AND se.show_id = st.show_id
      ORDER BY se.row_label, se.seat_number
    `, [showtimeId, showtimeId]);
    
    res.json({
      showtime: showtime,
      seats: seats
    });
  } catch (err) { 
    next(err); 
  }
});

module.exports = router;