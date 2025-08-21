const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();
const upload = multer({ storage: multer.memoryStorage() });
const containerName = 'product-images';
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

// Multer storage config

// const fs = require('fs');
// const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'photos');

// if (!fs.existsSync(uploadPath)) {
//     fs.mkdirSync(uploadPath, { recursive: true });
// }

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, path.join(__dirname, '..', '..' , 'uploads', 'photos'));
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });
//const upload = multer({ storage });

// Fetch all products for logged-in farmer
router.get('/products/:farmerId', async (req, res) => {
  const { farmerId } = req.params;
  const pool = req.app.locals.pool;

  try {
    const [products] = await pool.query(
      'SELECT * FROM farmers_products WHERE farmer_id = ?',
      [farmerId]
    );

    const enrichedProducts = [];

    for (const product of products) {
      const [[orderStats]] = await pool.query(
        'SELECT SUM(quantity) AS totalOrdered FROM consumer_orders WHERE product_id = ?',
        [product.id]
      );

      const totalOrdered = orderStats.totalOrdered || 0;
      const progressPercent = Math.min((totalOrdered / product.min_order) * 100, 100);

      enrichedProducts.push({
        ...product,
        totalOrdered,
        progressPercent
      });
    }

    res.json(enrichedProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});


// Add new product with image
router.post('/add-product', upload.single('productImage'), async (req, res) => {
  const { farmerId, productName, productDetails, deliveryLocation, price, minOrder, maxOrder } = req.body;

  if (!farmerId || !productName || !productDetails || !deliveryLocation || !price || !minOrder || !maxOrder || !req.file) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Upload to Azure Blob Storage
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${Date.now()}-${req.file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype }
    });

    const imageUrl = blockBlobClient.url;

    // Save product to DB
    const pool = req.app.locals.pool;
    await pool.query(
      `INSERT INTO farmers_products (farmer_id, product_name, product_details, delivery_location, price, min_order, max_order, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [farmerId, productName, productDetails, deliveryLocation, price, minOrder, maxOrder, imageUrl]
    );

    res.status(201).json({ message: 'Product added successfully' });
  } catch (err) {
    console.error('Upload or DB error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// delivery handle

router.post('/start-delivery/:productId', async (req, res) => {
  const { productId } = req.params;
  const pool = req.app.locals.pool;

  try {
    const [[product]] = await pool.query(
      'SELECT min_order, max_order FROM farmers_products WHERE id = ?',
      [productId]
    );

    const [[orderStats]] = await pool.query(
      'SELECT SUM(quantity) AS totalOrdered FROM consumer_orders WHERE product_id = ?',
      [productId]
    );

    const totalOrdered = orderStats.totalOrdered || 0;

    if (totalOrdered >= product.min_order && totalOrdered <= product.max_order) {
      await pool.query(
        'UPDATE farmers_products SET is_delivering = 1 WHERE id = ?',
        [productId]
      );
      res.json({ message: 'Delivery started.' });
    } else {
      res.status(400).json({ message: 'Order quantity not within delivery range.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
