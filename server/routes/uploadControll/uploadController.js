// routes/uploadController.js
const express = require('express');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const containerName = 'product-images';
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${Date.now()}-${req.file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype }
    });

    res.status(200).json({ imageUrl: blockBlobClient.url });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

module.exports = router;
