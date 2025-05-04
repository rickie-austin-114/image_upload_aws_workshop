const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const cors = require('cors');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

// POST endpoint - Upload image
app.post('/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const imageName = req.body.name || originalname;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${imageName}`,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read'
    };

    const uploadResult = await s3.upload(params).promise();

    res.status(201).json({
      message: 'Image uploaded successfully',
      imageUrl: uploadResult.Location,
      imageName: imageName
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// GET endpoint - Retrieve image
app.get('/images/:name', async (req, res) => {
  try {
    const name = req.params.name;

    const listParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: name
    };

    const data = await s3.listObjectsV2(listParams).promise();

    if (!data.Contents || data.Contents.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const imageKey = data.Contents[0].Key;
    const getParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: imageKey
    };

    const imageStream = s3.getObject(getParams).createReadStream();
    res.setHeader('Content-Type', 'image/*');
    imageStream.pipe(res);
  } catch (error) {
    console.error('Retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});