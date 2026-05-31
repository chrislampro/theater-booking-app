// backend/routes/bookings.js
const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// POST /api/bookings - Create a booking
router.post('/', authenticate, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { show_id, seat_ids, showtime_id } = req.body;
    if (!show_id || !Array.isArray(seat_ids) || !seat_ids.length || !showtime_id) {
      return res.status(400).json({ message: 'show_id, showtime_id and seat_ids[] are required' });
    }

    // Fetch showtime price
    const [[showtime]] = await conn.query(
      'SELECT price, show_date, show_time FROM showtimes WHERE showtime_id = ? AND show_id = ?',
      [showtime_id, show_id]
    );
    if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

    // Lock and verify seats are free
    const [seats] = await conn.query(`
      SELECT se.id, se.price_multiplier
      FROM seats se
      LEFT JOIN booking_seats bs ON bs.seat_id = se.id
        AND bs.booking_id IN (
          SELECT id FROM bookings WHERE show_id = ? AND status = 'confirmed'
        )
      WHERE se.id IN (?) AND se.show_id = ? AND bs.id IS NULL
      FOR UPDATE
    `, [show_id, seat_ids, show_id]);

    if (seats.length !== seat_ids.length) {
      return res.status(409).json({ message: 'One or more seats are already booked' });
    }

    // Calculate total with multipliers
    let total = 0;
    for (const seat of seats) {
      total += parseFloat(showtime.price) * parseFloat(seat.price_multiplier);
    }
    total = total.toFixed(2);

    // Insert booking with showtime_id
    const [booking] = await conn.query(
      'INSERT INTO bookings (user_id, show_id, showtime_id, total_price, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, show_id, showtime_id, total, 'confirmed']
    );

    // Link seats
    const seatRows = seat_ids.map(sid => [booking.insertId, sid]);
    await conn.query('INSERT INTO booking_seats (booking_id, seat_id) VALUES ?', [seatRows]);

    // Update available seats in showtimes
    await conn.query(
      'UPDATE showtimes SET available_seats = available_seats - ? WHERE showtime_id = ?',
      [seat_ids.length, showtime_id]
    );

    await conn.commit();
    res.status(201).json({ 
      id: booking.insertId, 
      total_price: total, 
      message: 'Booking confirmed!' 
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// GET /api/bookings/my - Current user's bookings
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT
        b.id,
        b.status,
        b.total_price,
        b.created_at,
        s.title AS show_title,
        s.description,
        s.duration,
        s.genre,
        t.name as theatre_name,
        t.location,
        st.show_date,
        st.show_time,
        GROUP_CONCAT(
          CONCAT(se.row_label, se.seat_number, '(', se.category, ')') 
          ORDER BY se.row_label, se.seat_number 
          SEPARATOR ', '
        ) AS seats
      FROM bookings b
      JOIN shows s ON s.id = b.show_id
      JOIN theatres t ON t.theatre_id = s.theatre_id
      JOIN showtimes st ON st.showtime_id = b.showtime_id
      JOIN booking_seats bs ON bs.booking_id = b.id
      JOIN seats se ON se.id = bs.seat_id
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { 
    next(err); 
  }
});

// DELETE /api/bookings/:id - Cancel a booking
router.delete('/:id', authenticate, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const [[booking]] = await conn.query(
      `SELECT b.*, COUNT(bs.seat_id) as seat_count 
       FROM bookings b
       JOIN booking_seats bs ON bs.booking_id = b.id
       WHERE b.id = ? AND b.user_id = ?`,
      [req.params.id, req.user.id]
    );
    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Already cancelled' });
    }

    // Update booking status
    await conn.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
    
    // Restore available seats in showtimes
    await conn.query(
      'UPDATE showtimes SET available_seats = available_seats + ? WHERE showtime_id = ?',
      [booking.seat_count, booking.showtime_id]
    );

    await conn.commit();
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;