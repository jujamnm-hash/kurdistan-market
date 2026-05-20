const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { protect } = require('../middleware/auth');

// GET /api/travelers/profile
router.get('/profile', protect(['traveler']), async (req, res) => {
  try {
    const db = req.app.get('db');
    const doc = await db.collection('travelers').doc(req.user.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'بەکارهێنەر نەدۆزرایەوە' });

    const data = doc.data();
    const savedSellerIds = data.savedSellers || [];
    const savedSellers = [];

    for (const sellerId of savedSellerIds) {
      const sellerDoc = await db.collection('sellers').doc(sellerId).get();
      if (sellerDoc.exists) {
        const sellerData = sellerDoc.data();
        delete sellerData.password;
        savedSellers.push({ _id: sellerDoc.id, ...sellerData });
      }
    }

    res.json({
      success: true,
      traveler: {
        _id: doc.id,
        name: data.name,
        phone: data.phone,
        profileImage: data.profileImage,
        savedSellers
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// POST /api/travelers/save-seller/:sellerId
router.post('/save-seller/:sellerId', protect(['traveler']), async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('travelers').doc(req.user.id).update({
      savedSellers: admin.firestore.FieldValue.arrayUnion(req.params.sellerId)
    });
    const doc = await db.collection('travelers').doc(req.user.id).get();
    const data = doc.data();
    res.json({
      success: true,
      message: 'فرۆشیار پاشەکەوت کرا',
      traveler: { _id: doc.id, name: data.name, phone: data.phone, savedSellers: data.savedSellers }
    });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// DELETE /api/travelers/save-seller/:sellerId
router.delete('/save-seller/:sellerId', protect(['traveler']), async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('travelers').doc(req.user.id).update({
      savedSellers: admin.firestore.FieldValue.arrayRemove(req.params.sellerId)
    });
    const doc = await db.collection('travelers').doc(req.user.id).get();
    const data = doc.data();
    res.json({
      success: true,
      message: 'فرۆشیار لابرا',
      traveler: { _id: doc.id, name: data.name, phone: data.phone, savedSellers: data.savedSellers }
    });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

module.exports = router;
