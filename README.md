# 🎪 Theater Mayhem - Theater Booking Application

A full-stack mobile application for booking theater seats, built with React Native, Node.js, Express, and MariaDB/MySQL.

## 📱 Project Overview

Theater Mayhem is a distributed mobile application that allows users to:
- Browse theater shows and venues
- Search shows by title, theatre, or location
- View show details (duration, age rating, genre)
- Select seats interactively with different categories (VIP, Premium, Standard)
- Make and manage bookings securely
- Rate shows and read reviews from other users

## 🏗️ System Architecture

[React Native App] <--> [Node.js REST API] <--> [MariaDB Database]

Communication Flow:
User -> Mobile App -> REST API -> Database -> Response -> App

Technology Layers:
- Client Layer: React Native + Expo
- API Layer: Node.js + Express + JWT Authentication
- Database Layer: MariaDB / MySQL

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React Native, Expo |
| Backend | Node.js, Express.js |
| Database | MariaDB / MySQL |
| Authentication | JWT (JSON Web Tokens) |
| Password Security | bcryptjs |
| Secure Storage | expo-secure-store |
| HTTP Client | Fetch API |

## 📋 Features

| Category | Features |
|----------|----------|
| Authentication | User registration, Login, JWT tokens, Token refresh, Secure storage |
| Discovery | Browse shows, Search by title/theatre/location, View theatre details |
| Shows | Duration, Age rating, Genre, Description, Reviews and ratings |
| Seat Selection | Interactive seat map, VIP/Premium/Standard categories, Dynamic pricing |
| Bookings | Create booking, View booking history, Cancel future bookings |
| Reviews | Rate shows (1-5 stars), Write comments, View user reviews |

## 🗄️ Database Schema

Tables:
- users - Authentication and user data
- theatres - Venue information with facilities
- shows - Performance details (duration, age rating, description)
- showtimes - Specific dates and times for shows
- seats - Seat map with categories and price multipliers
- bookings - User reservations
- booking_seats - Junction table for bookings and seats
- reviews - User ratings and comments
- theatre_facilities - Amenities per theatre

## 🔧 Installation Guide

### Prerequisites

- Node.js (v20 or higher)
- XAMPP (for MariaDB)
- Expo Go app on your phone
- Git

### Step 1: Clone and Database Setup

Clone the repository:
bash
git clone https://github.com/yourusername/Theater Mayhem-theater-booking.git
cd Theater Mayhem-theater-booking

Start XAMPP and enable MySQL, then run the database schema:
bash
mysql -u root -p < database/schema.sql

Default admin credentials:
- Email: admin@theater.com
- Password: admin123

### Step 2: Backend Setup

Navigate to backend folder and install dependencies:
bash
cd backend
npm install

Create a .env file:
env
PORT=4001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=theater_db
JWT_SECRET=your_super_secret_key_here

Start the backend server:
bash
npm run dev

The API will run on http://localhost:4001

### Step 3: Frontend Setup

Navigate to frontend folder and install dependencies:
bash
cd frontend
npm install

Update the API URL in App.js:
javascript
// For Android emulator
const API_URL = 'http://10.0.2.2:4001/api';

// For physical device (use your computer's IP)
const API_URL = 'http://192.168.x.x:4001/api';

Start the Expo development server:
bash
npx expo start

### Step 4: Run the App

- Press 'a' for Android emulator
- Press 'i' for iOS simulator
- Scan QR code with Expo Go app for physical device

## 🔌 API Endpoints

Authentication:
- POST /api/auth/register - Create new account
- POST /api/auth/login - Login and get tokens
- POST /api/auth/refresh - Refresh expired JWT
- POST /api/auth/logout - Revoke tokens

Data Retrieval:
- GET /api/shows - List shows (supports search)
- GET /api/theatres - List all theatres
- GET /api/showtimes - Available showtimes
- GET /api/shows/:id/seats - Seat map with categories

Bookings:
- POST /api/bookings - Create new booking
- GET /api/bookings/my - Get user's bookings
- DELETE /api/bookings/:id - Cancel booking

Reviews:
- POST /api/reviews - Submit a review
- GET /api/shows/:id/reviews - Get show reviews

## 🧪 Testing with cURL

Login to get a token:
bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@theater.com","password":"admin123"}'

Get all shows (use the token from login response):
bash
curl http://localhost:4001/api/shows \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

Search for a show:
bash
curl "http://localhost:4001/api/shows?q=Hamlet" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

Get all theatres:
bash
curl http://localhost:4001/api/theatres \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

Get seat map for a show:
bash
curl http://localhost:4001/api/shows/1/seats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

Create a booking:
bash
curl -X POST http://localhost:4001/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"show_id":1,"showtime_id":1,"seat_ids":[1,2,3]}'

Get your bookings:
bash
curl http://localhost:4001/api/bookings/my \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

Cancel a booking:
bash
curl -X DELETE http://localhost:4001/api/bookings/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"


## 🔒 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT authentication with 7-day expiration
- Refresh tokens with 30-day expiration
- Secure token storage using expo-secure-store
- SQL injection protection via parameterized queries
- CORS configuration for allowed origins
- Input validation on all endpoints

## 🎯 Concurrent Booking Handling

The system prevents double bookings using database transactions with row-level locking:

1. START TRANSACTION
2. SELECT seats FOR UPDATE (locks the selected rows)
3. Check if seats are still available
4. INSERT into bookings table
5. INSERT into booking_seats table
6. UPDATE showtimes available_seats count
7. COMMIT

This ensures ACID compliance and prevents race conditions.

## 🚀 Future Improvements

- OAuth 2.0 / Social login (Google, Facebook)
- Push notifications for booking reminders
- PDF ticket generation with QR codes
- Real-time seat updates with WebSockets
- Multi-language support
- Dark/Light theme toggle
- Offline mode with local storage
- Email confirmation for bookings


## 🙏 Acknowledgments

- React Native documentation
- Node.js/Express guides
- MariaDB reference
- Expo documentation

## 📄 License

This project was developed for educational purposes as part of the CN6035 course requirements.
