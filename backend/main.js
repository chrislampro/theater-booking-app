const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const showRoutes = require('./routes/shows');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const theatreRoutes = require('./routes/theatres');
const showtimesRoutes = require('./routes/showtimes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/shows', showRoutes);

app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/showtimes', showtimesRoutes);

app.get("/health", (req, res) => {
  console.log("HEALTH HIT");
  res.status(200).json({ ok: true });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server API running on port ${PORT}`));