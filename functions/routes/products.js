const express = require('express');
const router = express.Router();

// GET /api/products/search?q=name
router.get('/search', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'ناوی کالا پێویستە' });

    const snapshot = await db.collection('sellers').get();
    const qLower = q.toLowerCase();
    const results = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      delete data.password;
      const matchedProducts = (data.products || []).filter(p =>
        p.name.toLowerCase().includes(qLower)
      );
      if (matchedProducts.length > 0) {
        results.push({ _id: doc.id, ...data, matchedProducts });
      }
    }

    results.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
    res.json({ success: true, count: results.length, sellers: results });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

module.exports = router;
