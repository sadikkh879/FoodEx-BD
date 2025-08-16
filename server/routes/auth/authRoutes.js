const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');


// Consumer Registration
router.post('/register/consumer', async (req, res) => {
    const { name, email, password, address } = req.body;
    const role = 'consumer';

    if (!name || !email || !password || !address) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
    const pool = req.app.locals.pool;
    const [existing] = await pool.query('SELECT id FROM consumers WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ message: 'Email Already Exists' });

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
        'INSERT INTO consumers (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashed, address, role]
    );

    const consumerId = result.insertId;

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await pool.query(
        'INSERT INTO email_verifications (consumer_id, token, expires_at) VALUES (?, ?, ?)',
        [consumerId, token, expiresAt]
    );

    // Send email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'emilyygreyy749@gmail.com',
            pass: 'yusx htkf xzjd czwj'
        }
    });

    const verificationLink = `http://localhost:3000/api/auth/verify-email?token=${token}`;

    await transporter.sendMail({
        from: '"Foodex" <emilyygreyy749@gmail.com>',
        to: email,
        subject: 'Verify your Foodex email',
        html: `<p>Hi ${name},</p><p>Please verify your email by clicking the link below:</p><a href="${verificationLink}">Verify Email</a>`
    });

    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });

} catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error during registration' });
}

});



//Verify Email
router.get('/verify-email', async (req, res) => {
  const pool = req.app.locals.pool;
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Missing verification token.');
  }

  try {
    // Check if token is valid and not expired
    const [rows] = await pool.execute(
      'SELECT consumer_id FROM email_verifications WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).send('Invalid or expired token.');
    }

    const consumerId = rows[0].consumer_id;

    // Mark email as verified
    await pool.execute(
      'UPDATE consumers SET email_verified = TRUE WHERE id = ?',
      [consumerId]
    );

    // Remove token from table
    await pool.execute(
      'DELETE FROM email_verifications WHERE consumer_id = ?',
      [consumerId]
    );

    res.send(`
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body {
              font-family: 'Segoe UI', sans-serif;
              background: #f4f6f8;
              text-align: center;
              padding: 4rem;
            }
            .message {
              background: #fff;
              padding: 2rem;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              display: inline-block;
            }
            h2 {
              color: #007bff;
            }
            a {
              display: inline-block;
              margin-top: 1rem;
              color: #007bff;
              text-decoration: none;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="message">
            <h2>✅ Email Verified Successfully!</h2>
            <p>You can now log in and complete your profile.</p>
            <a href="/consumer_login.html">Go to Login</a>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error during verification.');
  }
});


// Farmer Registration
router.post('/register/farmer', async (req, res) => {
    const { name, email, password, farmName, location } = req.body;
    const role = 'farmer';

    if (!name || !email || !password || !farmName || !location) {
        return res.status(400).json({ message: 'All fields are required' });
    }

try {
        const pool = req.app.locals.pool;
        const [existing] = await pool.query('SELECT id FROM farmers WHERE email = ?', [email]);
        if (existing.length) return res.status(400).json({message:'Email Alredy Exists'});

        const hashed = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO farmers (name, email, password, farmname, location, role) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashed, farmName, location, role]
        );

        res.status(201).json({message: 'Registration Successful.'});

    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server Error during registration'});
    }

});

// Farmer Login
router.post('/login/farmer', async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM farmers WHERE email = ?', [email]);
    if (!rows.length) return res.status(400).json({ message: 'Invalid credentials.' });

    const farmer = rows[0];
    const valid = await bcrypt.compare(password, farmer.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: farmer.id, role: farmer.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, id: farmer.id, role: farmer.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Consumer Login
router.post('/login/consumer', async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM consumers WHERE email = ?', [email]);
    if (!rows.length) return res.status(400).json({ message: 'Invalid credentials.' });

    const consumer = rows[0];

    // Check if email is verified
    if (!consumer.email_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const valid = await bcrypt.compare(password, consumer.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: consumer.id, role: consumer.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, role: consumer.role, id: consumer.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});


module.exports = router;
