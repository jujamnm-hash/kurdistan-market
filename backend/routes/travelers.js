const express = require('express');
const router = express.Router();
const Traveler = require('../models/Traveler');
const { protect } = require('../middleware/auth');

// GET /api/travelers/profile
router.get('/profile', protect(['traveler']), async (req, res) => {
  try {
    const traveler = await Traveler.findById(req.user.id).select('-password').populate('savedSellers', '-password');
    if (!traveler) return res.status(404).json({ error: 'بەکارهێنەر نەدۆزرایەوە' });
    res.json({ success: true, traveler });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// POST /api/travelers/save-seller/:sellerId
router.post('/save-seller/:sellerId', protect(['traveler']), async (req, res) => {
  try {
    const traveler = await Traveler.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { savedSellers: req.params.sellerId } },
      { new: true }
    ).select('-password');
    res.json({ success: true, message: 'فرۆشیار پاشەکەوت کرا', traveler });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// DELETE /api/travelers/save-seller/:sellerId
router.delete('/save-seller/:sellerId', protect(['traveler']), async (req, res) => {
  try {
    const traveler = await Traveler.findByIdAndUpdate(
      req.user.id,
      { $pull: { savedSellers: req.params.sellerId } },
      { new: true }
    ).select('-password');
    res.json({ success: true, message: 'فرۆشیار لابرا', traveler });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

module.exports = router;
