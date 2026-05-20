const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Seller = require('../models/Seller');
const Traveler = require('../models/Traveler');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// POST /api/auth/seller/register
router.post('/seller/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('ناو دەبێت لانیکەم ٢ پیت بێت'),
  body('phone').matches(/^07[5-9][0-9]{8}$/).withMessage('ژمارەی تەلەفۆن نادروستە'),
  body('password').isLength({ min: 6 }).withMessage('وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, phone, password, description, location } = req.body;

    const existingSeller = await Seller.findOne({ phone });
    if (existingSeller) {
      return res.status(400).json({ error: 'ئەم ژمارە تەلەفۆنە پێشتر تۆمار کراوە' });
    }

    const seller = await Seller.create({ name, phone, password, description, location });
    const token = generateToken(seller._id, 'seller');

    res.status(201).json({
      success: true,
      message: 'سەرکەوتووانە تۆمار کرایت',
      token,
      seller: {
        _id: seller._id,
        name: seller.name,
        phone: seller.phone,
        description: seller.description,
        location: seller.location,
        products: seller.products,
        isOnline: seller.isOnline,
        rating: seller.rating
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// POST /api/auth/seller/login
router.post('/seller/login', [
  body('phone').matches(/^07[5-9][0-9]{8}$/).withMessage('ژمارەی تەلەفۆن نادروستە'),
  body('password').exists().withMessage('وشەی نهێنی پێویستە')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { phone, password } = req.body;
    const seller = await Seller.findOne({ phone });
    if (!seller) {
      return res.status(401).json({ error: 'ژمارە یان وشەی نهێنی هەڵەیە' });
    }

    const isMatch = await seller.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'ژمارە یان وشەی نهێنی هەڵەیە' });
    }

    const token = generateToken(seller._id, 'seller');
    res.json({
      success: true,
      token,
      seller: {
        _id: seller._id,
        name: seller.name,
        phone: seller.phone,
        description: seller.description,
        location: seller.location,
        products: seller.products,
        isOnline: seller.isOnline,
        rating: seller.rating
      }
    });
  } catch (err) {
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
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, phone, password } = req.body;
    const existing = await Traveler.findOne({ phone });
    if (existing) {
      return res.status(400).json({ error: 'ئەم ژمارە تەلەفۆنە پێشتر تۆمار کراوە' });
    }

    const traveler = await Traveler.create({ name, phone, password });
    const token = generateToken(traveler._id, 'traveler');

    res.status(201).json({
      success: true,
      message: 'سەرکەوتووانە تۆمار کرایت',
      token,
      traveler: {
        _id: traveler._id,
        name: traveler.name,
        phone: traveler.phone
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// POST /api/auth/traveler/login
router.post('/traveler/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const traveler = await Traveler.findOne({ phone });
    if (!traveler) {
      return res.status(401).json({ error: 'ژمارە یان وشەی نهێنی هەڵەیە' });
    }

    const isMatch = await traveler.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'ژمارە یان وشەی نهێنی هەڵەیە' });
    }

    const token = generateToken(traveler._id, 'traveler');
    res.json({
      success: true,
      token,
      traveler: {
        _id: traveler._id,
        name: traveler.name,
        phone: traveler.phone
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

module.exports = router;
