const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/seller/register
router.post('/seller/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('ناو دەبێت لانیکەم ٢ پیت بێت'),
  body('phone').matches(/^07[5-9][0-9]{8}$/).withMessage('ژمارەی تەلەفۆن نادروستە'),
  body('password').isLength({ min: 6 }).withMessage('وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const db = req.app.get('db');
    const { name, phone, password, description, location } = req.body;

    const existing = await db.collection('sellers').where('phone', '==', phone).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'ئەم ژمارە تەلەفۆنە پێشتر تۆمار کراوە' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const sellerData = {
      name,
      phone,
      password: hashedPassword,
      description: description || '',
      profileImage: '',
      products: [],
      location: location || { lat: null, lng: null, address: '' },
      isOnline: false,
      lastSeen: new Date().toISOString(),
      rating: { average: 0, count: 0 },
      ratedBy: [],
      isVerified: false,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('sellers').add(sellerData);
    const token = generateToken(docRef.id, 'seller');

    res.status(201).json({
      success: true,
      message: 'سەرکەوتووانە تۆمار کرایت',
      token,
      seller: {
        _id: docRef.id,
        name: sellerData.name,
        phone: sellerData.phone,
        description: sellerData.description,
        location: sellerData.location,
        products: sellerData.products,
        isOnline: sellerData.isOnline,
        rating: sellerData.rating,
        profileImage: sellerData.profileImage
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// POST /api/auth/seller/login
router.post('/seller/login', [
  body('phone').matches(/^07[5-9][0-9]{8}$/).withMessage('ژمارەی تەلەفۆن نادروستە'),
  body('password').exists().withMessage('وشەی نهێنی پێویستە')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const db = req.app.get('db');
    const { phone, password } = req.body;

    const snapshot = await db.collection('sellers').where('phone', '==', phone).limit(1).get();
    if (snapshot.empty) {
      return res.status(401).json({ error: 'ژمارە یان وشەی نهێنی هەڵەیە' });
    }

    const sellerDoc = snapshot.docs[0];
    const seller = sellerDoc.data();

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'ژمارە یان وشەی نهێنی هەڵەیە' });
    }

    const token = generateToken(sellerDoc.id, 'seller');
    res.json({
      success: true,
      token,
      seller: {
        _id: sellerDoc.id,
        name: seller.name,
        phone: seller.phone,
        description: seller.description,
        location: seller.location,
        products: seller.products,
        isOnline: seller.isOnline,
        rating: seller.rating,
        profileImage: seller.profileImage
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// POST /api/auth/traveler/register
router.post('/traveler/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('ناو دەبێت لانیکەم ٢ پیت بێت'),
  body('phone').matches(/^07[5-9][0-9]{8}$/).withMessage('ژمارەی تەلەفۆن نادروستە'),
  body('password').isLength({ min: 6 }).withMessage('وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const db = req.app.get('db');
    const { name, phone, password } = req.body;

    const existing = await db.collection('travelers').where('phone', '==', phone).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'ئەم ژمارە تەلەفۆنە پێشتر تۆمار کراوە' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const travelerData = {
      name,
      phone,
      password: hashedPassword,
      profileImage: '',
      savedSellers: [],
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('travelers').add(travelerData);
    const token = generateToken(docRef.id, 'traveler');

    res.status(201).json({
      success: true,
      message: 'سەرکەوتووانە تۆمار کرایت',
      token,
      traveler: {
        _id: docRef.id,
        name: travelerData.name,
        phone: travelerData.phone,
        profileImage: travelerData.profileImage,
        savedSellers: []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// POST /api/auth/traveler/login
router.post('/traveler/login', [
  body('phone').matches(/^07[5-9][0-9]{8}$/).withMessage('ژمارەی تەلەفۆن نادروستە'),
  body('password').exists().withMessage('وشەی نهێنی پێویستە')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const db = req.app.get('db');
    const { phone, password } = req.body;

    const snapshot = await db.collection('travelers').where('phone', '==', phone).limit(1).get();
    if (snapshot.empty) {
      return res.status(401).json({ error: 'ژمارە یان وشەی نهێنی هەڵەیە' });
    }

    const travelerDoc = snapshot.docs[0];
    const traveler = travelerDoc.data();

    const isMatch = await bcrypt.compare(password, traveler.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'ژمارە یان وشەی نهێنی هەڵەیە' });
    }

    const token = generateToken(travelerDoc.id, 'traveler');
    res.json({
      success: true,
      token,
      traveler: {
        _id: travelerDoc.id,
        name: traveler.name,
        phone: traveler.phone,
        profileImage: traveler.profileImage,
        savedSellers: traveler.savedSellers
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

module.exports = router;
