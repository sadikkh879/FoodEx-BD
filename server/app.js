require('dotenv').config();
const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth/authRoutes');
const farmerRoutes = require('./routes/farmer/farmerRoutes');
const consumerRoutes = require('./routes/consumer/consumerRoutes');
const mysql = require('mysql2/promise');

const app = express();

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/consumer', consumerRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Set up MySQL connection pool
app.locals.pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'landing.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
