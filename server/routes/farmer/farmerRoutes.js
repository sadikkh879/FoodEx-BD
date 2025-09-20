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



// Fetch single products for logged-in farmer with orders & delivery locations
router.get('/products/:farmerId', async (req, res) => {
  const { farmerId } = req.params;
  const pool = req.app.locals.pool;

  try {
    // Get all products for this farmer
    const [products] = await pool.query(
      'SELECT * FROM farmers_products WHERE farmer_id = ? AND is_bulk = 0',
      [farmerId]
    );

    const enrichedProducts = [];

    for (const product of products) {
      // Get all orders for this product with consumer info & delivery location
      const [orders] = await pool.query(
        `SELECT 
           co.id AS order_id,
           co.quantity,
           co.created_at AS order_date,
           co.division_name,
           co.district_name,
           co.upazila_name,
           co.additional_location,
           c.name AS consumer_name
         FROM consumer_orders co
         JOIN consumers c ON co.consumer_id = c.id
         WHERE co.product_id = ?
         ORDER BY co.created_at DESC`,
        [product.id]
      );

      // Calculate total ordered from these orders
      const totalOrdered = orders.reduce((sum, o) => sum + o.quantity, 0);

      enrichedProducts.push({
        ...product,
        totalOrdered,
        orders // full list of orders with location details
      });
    }

    res.json(enrichedProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

//bulk products fetch
router.get('/bulk-products/:farmerId', async (req, res) => {
  const { farmerId } = req.params;
  const pool = req.app.locals.pool;

  try {
    // Get all products for this farmer
    const [products] = await pool.query(
      'SELECT * FROM farmers_products WHERE farmer_id = ? AND is_bulk = 1',
      [farmerId]
    );

    const enrichedProducts = [];

    for (const product of products) {
      // Get all orders for this product with consumer info & delivery location
      const [orders] = await pool.query(
        `SELECT 
           co.id AS order_id,
           co.quantity,
           co.created_at AS order_date,
           co.division_name,
           co.district_name,
           co.upazila_name,
           co.additional_location,
           c.name AS consumer_name
         FROM consumer_orders co
         JOIN consumers c ON co.consumer_id = c.id
         WHERE co.product_id = ?
         ORDER BY co.created_at DESC`,
        [product.id]
      );

      // Calculate total ordered from these orders
      const totalOrdered = orders.reduce((sum, o) => sum + o.quantity, 0);

      enrichedProducts.push({
        ...product,
        totalOrdered,
        orders // full list of orders with location details
      });
    }

    res.json(enrichedProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

// individual orders tracking per products

router.get('/product-orders/:productId', async (req, res) => {
  const { productId } = req.params;
  const pool = req.app.locals.pool;

  try {
    const [[product]] = await pool.query(
      'SELECT id, product_name FROM farmers_products WHERE id = ?',
      [productId]
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const [orders] = await pool.query(
      `SELECT 
         co.id AS order_id,
         co.quantity,
         co.created_at AS order_date,
         co.division_name,
         co.district_name,
         co.upazila_name,
         co.additional_location,
         co.mobile_no,
         co.status,
         c.name AS consumer_name
       FROM consumer_orders co
       JOIN consumers c ON co.consumer_id = c.id
       WHERE co.product_id = ?
       ORDER BY co.created_at DESC`,
      [productId]
    );

    res.json({
      product_name: product.product_name,
      orders
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Order status update
router.post('/order-status/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const pool = req.app.locals.pool;

  try {
    await pool.execute(
      'UPDATE consumer_orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});


// Add new Bulk product with image
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
      `INSERT INTO farmers_products (farmer_id, product_name, product_details, delivery_location, price, min_order, max_order, image, is_bulk) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [farmerId, productName, productDetails, deliveryLocation, price, minOrder, maxOrder, imageUrl, 1]
    );

    res.status(201).json({ message: 'Product added successfully' });
  } catch (err) {
    console.error('Upload or DB error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// Add new Single product with image
router.post('/addSingle-product', upload.single('productImage'), async (req, res) => {
  const { farmerId, productName, productDetails, price, storage } = req.body;

  if (!farmerId || !productName || !productDetails || !price || !storage || !req.file) {
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
      `INSERT INTO farmers_products (farmer_id, product_name, product_details, price, storage, image, is_bulk) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [farmerId, productName, productDetails, price, storage, imageUrl, 0]
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
