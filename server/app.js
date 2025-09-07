require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth/authRoutes');
const farmerRoutes = require('./routes/farmer/farmerRoutes');
const consumerRoutes = require('./routes/consumer/consumerRoutes');
const mysql = require('mysql2/promise');
const uploadRoute = require('./routes/uploadControll/uploadController');
const app = express();

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/consumer', consumerRoutes);
app.use('/api', uploadRoute);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Set up MySQL connection pool
async function initDB() {
  try{
  app.locals.pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  ssl: {
        ca: fs.readFileSync(path.join(__dirname, 'ca.pem')),
        rejectUnauthorized: true
      },
});  
// Try a quick query to confirm connection
    await app.locals.pool.query('SELECT 1');
    console.log('✅ Database connected');
  } catch (err) {
    console.error('⚠️ Database connection failed:', err.message);
    app.locals.pool = null; // Prevents routes from using a bad pool
  }
}

initDB();


// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'landing.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
