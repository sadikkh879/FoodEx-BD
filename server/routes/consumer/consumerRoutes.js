const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

//Face Check function
async function checkFace(photoPath) {
  const form = new FormData();
  form.append('photo', fs.createReadStream(photoPath));

  const res = await axios.post('http://localhost:5001/detect-face', form, {
    headers: form.getHeaders()
  });

  return res.data.faceDetected;
}


// Fetch all products from all farmers
router.get('/products', async (req, res) => {
    try {
    const pool = req.app.locals.pool;
    const [results] = await pool.query(`
        SELECT fp.*, f.location
        FROM farmers_products fp
        JOIN farmers f ON fp.farmer_id = f.id
    `);
    res.json(results);
} catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
}
});

router.get('/singleProduct/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM farmers_products WHERE id = ?', [productId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Order Placing 
router.post('/orders', async (req, res) => {
  const { product_id, quantity, consumer_id } = req.body;
  //const user_id = req.user.id;
  const pool = req.app.locals.pool;

  try {
    // Get product limits
    const [productRows] = await pool.execute(
      'SELECT min_order, max_order FROM farmers_products WHERE id = ?',
      [product_id]
    );
    const product = productRows[0];
    if (!product) return res.status(404).json({ message: 'Product not found' });


    //Check if user added NID and Image 
    const [verifyRows] = await pool.query(
    'SELECT number, nid_number, profile_photo FROM consumers WHERE id = ?',
    [consumer_id]
  );

  // if (!rows.length) {
  //   return res.status(404).json({ message: 'Consumer not found.' });
  // }

  const { number, nid_number, profile_photo } = verifyRows[0];

  if (!nid_number || !profile_photo || !number ) {
    return res.status(403).json({ message: 'Please complete your profile with Phone number, NID and photo before placing an order.' });
  }

    // Get current total ordered
    const [orderStatsRows] = await pool.execute(
      'SELECT SUM(quantity) AS totalOrdered FROM consumer_orders WHERE product_id = ?',
      [product_id]
    );
    const totalOrdered = orderStatsRows[0].totalOrdered || 0;

    // Check if adding this order exceeds max_order
    if (quantity > product.max_order) {
      return res.status(400).json({
        message: `Only ${product.max_order - totalOrdered}kg left.`
      });
    }

    // if (totalOrdered + quantity > product.max_order) {
    //   return res.status(400).json({
    //     message: `Order exceeds max limit. Only ${product.max_order - totalOrdered}kg left.`
    //   });
    // }


    // Place the order
    await pool.execute(
      'INSERT INTO consumer_orders (consumer_id, product_id, quantity) VALUES (?, ?, ?)',
      [consumer_id, product_id, quantity]
    );

    res.json({ message: 'Order placed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Existing Order Check
router.get('/orders/check', async (req, res) => {
  const { consumer_id, product_id } = req.query;
  const pool = req.app.locals.pool;

  if (!consumer_id || !product_id) {
    return res.status(400).json({ ordered: false, message: 'Missing consumer_id or product_id' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id FROM consumer_orders WHERE consumer_id = ? AND product_id = ?',
      [consumer_id, product_id]
    );

    if (rows.length > 0) {
      return res.json({ ordered: true });
    } else {
      return res.json({ ordered: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ordered: false, message: 'Server error' });
  }
});


// Order Progress
router.get('/products/:id/progress', async (req, res) => {
  const productId = req.params.id;
  const pool = req.app.locals.pool;

  try {
    // Get product info
    const [[product]] = await pool.query(
      'SELECT min_order FROM farmers_products WHERE id = ?',
      [productId]
    );

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Sum all orders for this product
    const [[orderStats]] = await pool.query(
      'SELECT SUM(quantity) AS totalOrdered FROM consumer_orders WHERE product_id = ?',
      [productId]
    );

    const totalOrdered = orderStats.totalOrdered || 0;
    const progressPercent = Math.min((totalOrdered / product.min_order) * 100, 100);

    res.json({
      totalOrdered,
      minOrder: product.min_order,
      progressPercent
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Update Profile
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: 'uploads/profiles/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `consumer_${req.params.id}${ext}`);
  }
});
const upload = multer({ storage });

// Checks NID validity
function isValidNID(nid) {
  return /^[0-9]{10}$/.test(nid) || /^[0-9]{13}$/.test(nid) || /^[0-9]{17}$/.test(nid);
}

router.put('/profile/:id', upload.single('photo'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { phone, nid_number } = req.body;

  try {
    // NID Validity checks
    if (!isValidNID(nid_number)) {
      return res.status(400).json({ message: 'Invalid NID format. Must be 10, 13, or 17 digits.' });
    }

    // Check for existing NID (excluding current user)
    const [existing] = await pool.execute(
      'SELECT id FROM consumers WHERE nid_number = ? AND id != ?',
      [nid_number, req.params.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'This NID is already registered with another account.' });
    }

    // let photoPath = null;

    // 1. Face validation with Flask
    if (req.file) {
      const faceForm = new FormData();
      faceForm.append('photo', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const flaskRes = await fetch('http://localhost:5001/detect-face', {
        method: 'POST',
        body: faceForm
      });

      const faceData = await flaskRes.json();

      if (!faceData.faceDetected) {
        return res.status(400).json({ message: "Please upload a clear photo showing your face." });
      }

      if (faceData.facesCount > 1) {
        return res.status(400).json({ message: "Multiple faces detected. Please upload a photo with only your face." });
      }
    }

    // 2. Save data to DB
    const { phone, nid_number } = req.body;
    const profilePhoto = req.file ? req.file.filename : null;

    await pool.query(
      "UPDATE consumers SET number=?, nid_number=?, profile_photo=? WHERE id=?",
      [phone, nid_number, profilePhoto, consumerId]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



router.get('/profile/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const [rows] = await pool.execute('SELECT name, email, address, number, nid_number, profile_photo FROM consumers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Consumer not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Order page load
router.get('/orders/summary/:consumerId', async (req, res) => {
  const { consumerId } = req.params;
  const pool = req.app.locals.pool;

  try {
    const [orders] = await pool.query(`
      SELECT co.id AS order_id, co.quantity, fp.product_name, fp.image, fp.min_order, fp.max_order,
             fp.delivery_location, fp.is_delivering,
             (SELECT SUM(quantity) FROM consumer_orders WHERE product_id = fp.id) AS totalOrdered
      FROM consumer_orders co
      JOIN farmers_products fp ON co.product_id = fp.id
      WHERE co.consumer_id = ?
    `, [consumerId]);

    const enriched = orders.map(o => ({
      ...o,
      progressPercent: Math.min((o.totalOrdered / o.min_order) * 100, 100)
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
