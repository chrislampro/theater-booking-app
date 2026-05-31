-- ─── database/schema.sql ──────────────────────────────────────────────────────
-- Complete working schema for Theater Booking App
-- mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS theater_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE theater_db;

-- ===================================================================
-- 1. USERS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB;

-- ===================================================================
-- 2. THEATRES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS theatres (
    theatre_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (location)
) ENGINE=InnoDB;

-- ===================================================================
-- 3. SHOWS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS shows (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200)   NOT NULL,
  venue       VARCHAR(200)   NOT NULL,
  theatre_id  INT UNSIGNED,
  show_date   DATE           NOT NULL,
  show_time   TIME           NOT NULL,
  price       DECIMAL(8,2)   NOT NULL,
  genre       ENUM('Drama','Musical','Comedy','Opera','Other') DEFAULT 'Drama',
  description TEXT,
  duration    INT DEFAULT 120,
  age_rating  VARCHAR(10) DEFAULT 'ALL',
  total_seats SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_show_date (show_date),
  INDEX idx_theatre (theatre_id),
  INDEX idx_title (title),
  FOREIGN KEY (theatre_id) REFERENCES theatres(theatre_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ===================================================================
-- 4. SHOWTIMES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS showtimes (
    showtime_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    show_id INT UNSIGNED NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    price DECIMAL(8,2) NOT NULL,
    available_seats INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
    INDEX idx_show_date (show_date),
    INDEX idx_show_time (show_time),
    UNIQUE KEY uq_show_datetime (show_id, show_date, show_time)
) ENGINE=InnoDB;

-- ===================================================================
-- 5. SEATS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS seats (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  show_id      INT UNSIGNED NOT NULL,
  row_label    CHAR(1)      NOT NULL,
  seat_number  TINYINT UNSIGNED NOT NULL,
  category     ENUM('standard','premium','vip') DEFAULT 'standard',
  price_multiplier DECIMAL(3,2) DEFAULT 1.00,
  UNIQUE KEY uq_seat (show_id, row_label, seat_number),
  FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
  INDEX idx_show (show_id),
  INDEX idx_category (category)
) ENGINE=InnoDB;

-- ===================================================================
-- 6. BOOKINGS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  show_id     INT UNSIGNED NOT NULL,
  showtime_id INT UNSIGNED NOT NULL,
  total_price DECIMAL(8,2) NOT NULL,
  status      ENUM('confirmed','cancelled') DEFAULT 'confirmed',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (show_id) REFERENCES shows(id),
  FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id),
  INDEX idx_user (user_id),
  INDEX idx_show (show_id),
  INDEX idx_showtime (showtime_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ===================================================================
-- 7. BOOKING_SEATS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS booking_seats (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  seat_id    INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_booking_seat (booking_id, seat_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id) REFERENCES seats(id)
) ENGINE=InnoDB;

-- ===================================================================
-- 8. REVIEWS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    show_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
    INDEX idx_show_rating (show_id, rating),
    UNIQUE KEY uq_user_show (user_id, show_id)
) ENGINE=InnoDB;

-- ===================================================================
-- 9. THEATRE_FACILITIES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS theatre_facilities (
    facility_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    theatre_id INT UNSIGNED NOT NULL,
    facility_name VARCHAR(100) NOT NULL,
    description TEXT,
    FOREIGN KEY (theatre_id) REFERENCES theatres(theatre_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===================================================================
-- 10. CREATE VIEW FOR AVAILABLE SHOWS
-- ===================================================================
CREATE OR REPLACE VIEW available_shows_view AS
SELECT 
    s.id as show_id,
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
    AND st.available_seats > 0
ORDER BY st.show_date ASC, st.show_time ASC;

-- ===================================================================
-- SEED DATA (in correct order)
-- ===================================================================

-- 1. Admin user
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES
('Admin', 'admin@theater.com', '$2a$12$LzJe.CqxTi2xlMpkMhVqUe8pVqPKVWJVR14ykh1xFbQZ3H2VrIJZm', 'admin');

-- 2. Theatres
INSERT IGNORE INTO theatres (theatre_id, name, location, description, address) VALUES
(1, 'Grand Theater', 'City Center', 'A historic theater with modern facilities and excellent acoustics.', '45 Grand Avenue, City Center, 10562'),
(2, 'Royal Hall', 'Downtown', 'Luxury theater with premium seating and world-class productions.', '12 Royal Crescent, Downtown, 10563'),
(3, 'City Stage', 'Cultural District', 'Contemporary theater space showcasing innovative works.', '78 Culture Street, Cultural District, 10564'),
(4, 'Opera House', 'Arts District', 'Grand opera house with excellent acoustics.', '1 Opera Plaza, Arts District, 10565');

-- 3. Shows
INSERT IGNORE INTO shows (id, title, venue, theatre_id, show_date, show_time, price, genre, description, duration, age_rating, total_seats) VALUES
(1, 'Hamlet', 'Grand Theater', 1, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '20:00', 35.00, 'Drama', 'The tragic story of the Prince of Denmark.', 180, 'PG-13', 50),
(2, 'The Phantom of the Opera', 'Royal Hall', 2, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '19:30', 55.00, 'Musical', 'The legendary musical about a mysterious phantom.', 165, 'PG-13', 60),
(3, 'A Midsummer Night\'s Dream', 'City Stage', 3, DATE_ADD(CURDATE(), INTERVAL 10 DAY), '18:00', 28.00, 'Comedy', 'Shakespeare\'s beloved comedy of love and magic.', 150, 'ALL', 40),
(4, 'La Traviata', 'Opera House', 4, DATE_ADD(CURDATE(), INTERVAL 14 DAY), '20:30', 75.00, 'Opera', 'Verdi\'s timeless opera about love and sacrifice.', 210, 'PG-13', 80);

-- 4. Generate Seats for each show (WITH categories included)
-- Hamlet (show_id=1) - 5 rows A-E
INSERT INTO seats (show_id, row_label, seat_number, category, price_multiplier)
SELECT 1, r.row_label, n.n,
    CASE 
        WHEN r.row_label = 'A' THEN 'vip'
        WHEN r.row_label IN ('B', 'C') THEN 'premium'
        ELSE 'standard'
    END,
    CASE 
        WHEN r.row_label = 'A' THEN 2.00
        WHEN r.row_label IN ('B', 'C') THEN 1.50
        ELSE 1.00
    END
FROM (SELECT 'A' row_label UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E') r
CROSS JOIN (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
      UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) n;

-- Phantom of the Opera (show_id=2) - 6 rows A-F
INSERT INTO seats (show_id, row_label, seat_number, category, price_multiplier)
SELECT 2, r.row_label, n.n,
    CASE 
        WHEN r.row_label = 'A' THEN 'vip'
        WHEN r.row_label IN ('B', 'C') THEN 'premium'
        ELSE 'standard'
    END,
    CASE 
        WHEN r.row_label = 'A' THEN 2.00
        WHEN r.row_label IN ('B', 'C') THEN 1.50
        ELSE 1.00
    END
FROM (SELECT 'A' row_label UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F') r
CROSS JOIN (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
      UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) n;

-- Midsummer Night's Dream (show_id=3) - 4 rows A-D
INSERT INTO seats (show_id, row_label, seat_number, category, price_multiplier)
SELECT 3, r.row_label, n.n,
    CASE 
        WHEN r.row_label = 'A' THEN 'vip'
        WHEN r.row_label IN ('B', 'C') THEN 'premium'
        ELSE 'standard'
    END,
    CASE 
        WHEN r.row_label = 'A' THEN 2.00
        WHEN r.row_label IN ('B', 'C') THEN 1.50
        ELSE 1.00
    END
FROM (SELECT 'A' row_label UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D') r
CROSS JOIN (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
      UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) n;

-- La Traviata (show_id=4) - 8 rows A-H
INSERT INTO seats (show_id, row_label, seat_number, category, price_multiplier)
SELECT 4, r.row_label, n.n,
    CASE 
        WHEN r.row_label = 'A' THEN 'vip'
        WHEN r.row_label IN ('B', 'C') THEN 'premium'
        ELSE 'standard'
    END,
    CASE 
        WHEN r.row_label = 'A' THEN 2.00
        WHEN r.row_label IN ('B', 'C') THEN 1.50
        ELSE 1.00
    END
FROM (SELECT 'A' row_label UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D'
      UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H') r
CROSS JOIN (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
      UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) n;

-- 5. Insert showtimes
INSERT INTO showtimes (show_id, show_date, show_time, price, available_seats)
SELECT id, show_date, show_time, price, total_seats FROM shows;

-- 6. Theatre Facilities
INSERT INTO theatre_facilities (theatre_id, facility_name, description) VALUES
(1, 'Wheelchair Access', 'Full wheelchair access throughout the venue'),
(1, 'Parking', 'On-site parking with 200 spaces'),
(1, 'Bar', 'Full service bar on every level'),
(2, 'Premium Lounge', 'Exclusive lounge for premium ticket holders'),
(2, 'Valet Parking', 'Valet parking service available'),
(2, 'Restaurant', 'Fine dining restaurant on premises'),
(3, 'Cafe', 'Modern cafe with organic options'),
(3, 'Studio Space', 'Rehearsal and workshop spaces'),
(4, 'Coat Check', 'Complimentary coat check service'),
(4, 'Souvenir Shop', 'Official merchandise store');

-- 7. Create Indexes for performance
CREATE INDEX idx_shows_theatre ON shows(theatre_id);
CREATE INDEX idx_shows_title ON shows(title);
CREATE INDEX idx_showtimes_date ON showtimes(show_date);
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_showtime ON bookings(showtime_id);
CREATE INDEX idx_seats_show_category ON seats(show_id, category);

-- ===================================================================
-- VERIFICATION
-- ===================================================================
SELECT '✅ Database setup complete!' as Status;
SELECT 'Theatres' as Table_Name, COUNT(*) as Count FROM theatres
UNION SELECT 'Shows', COUNT(*) FROM shows
UNION SELECT 'Showtimes', COUNT(*) FROM showtimes
UNION SELECT 'Seats', COUNT(*) FROM seats
UNION SELECT 'Users', COUNT(*) FROM users
UNION SELECT 'Facilities', COUNT(*) FROM theatre_facilities;