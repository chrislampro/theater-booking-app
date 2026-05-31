// ─── server/routes/admin.js ───────────────────────────────────────────────────
const router = require('express').Router();
const db     = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(authenticate, requireAdmin);

// POST /api/admin/shows  — create a new show
router.post('/shows', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { title, venue, show_date, show_time, price, genre, rows, seats_per_row } = req.body;
    if (!title || !venue || !show_date || !show_time || !price || !rows || !seats_per_row)
      return res.status(400).json({ message: 'All show fields are required' });

    const total_seats = rows * seats_per_row;
    const [result] = await conn.query(
      'INSERT INTO shows (title, venue, show_date, show_time, price, genre, total_seats) VALUES (?,?,?,?,?,?,?)',
      [title, venue, show_date, show_time, price, genre || 'Drama', total_seats]
    );

    // Auto-generate seat map
    const seatData = [];
    const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < rows; r++) {
      for (let n = 1; n <= seats_per_row; n++) {
        seatData.push([result.insertId, LABELS[r], n]);
      }
    }
    await conn.query('INSERT INTO seats (show_id, row_label, seat_number) VALUES ?', [seatData]);

    await conn.commit();
    res.status(201).json({ id: result.insertId, message: `Show created with ${total_seats} seats` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// GET /api/admin/shows  — all shows with booking stats
router.get('/shows', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.*,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) AS total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN bs.seat_id END) AS seats_booked,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_price END), 0) AS revenue
      FROM shows s
      LEFT JOIN bookings b ON b.show_id = s.id
      LEFT JOIN booking_seats bs ON bs.booking_id = b.id
      GROUP BY s.id
      ORDER BY s.show_date DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// DELETE /api/admin/shows/:id
router.delete('/shows/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM shows WHERE id = ?', [req.params.id]);
    res.json({ message: 'Show deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
