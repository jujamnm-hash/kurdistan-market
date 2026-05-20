const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');

// GET /api/products/search?q=name
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'ناوی کالا پێویستە' });

    const sellers = await Seller.find({
      'products.name': { $regex: q, $options: 'i' }
    }).select('-password');

    // Get online sellers from memory
    const onlineSellers = req.app.get('onlineSellers');
    const onlineIds = new Set([...onlineSellers.keys()].map(String));

    const results = sellers.map(s => ({
      ...s.toObject(),
      isOnline: onlineIds.has(String(s._id)),
      matchedProducts: s.products.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase())
      )
    }));

    // Sort: online first
    results.sort((a, b) => b.isOnline - a.isOnline);

    res.json({ success: true, count: results.length, sellers: results });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

module.exports = router;
