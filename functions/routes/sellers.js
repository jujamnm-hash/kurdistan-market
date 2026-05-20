const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/sellers - all sellers
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('sellers').get();
    const sellers = snapshot.docs.map(doc => {
      const data = doc.data();
      delete data.password;
      return { _id: doc.id, ...data };
    });
    res.json({ success: true, sellers });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// GET /api/sellers/online - only online sellers
router.get('/online', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('sellers').where('isOnline', '==', true).get();
    const sellers = snapshot.docs.map(doc => {
      const data = doc.data();
      delete data.password;
      return { _id: doc.id, ...data };
    });
    res.json({ success: true, sellers });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// GET /api/sellers/nearby?lat=&lng=&radius=&product=
router.get('/nearby', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { lat, lng, radius = 100, product } = req.query;

    const userLat = lat ? parseFloat(lat) : 36.1901;
    const userLng = lng ? parseFloat(lng) : 44.0091;
    const radiusKm = parseFloat(radius);

    const snapshot = await db.collection('sellers').where('isOnline', '==', true).get();
    let results = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      delete data.password;
      const sellerLat = data.location && data.location.lat;
      const sellerLng = data.location && data.location.lng;
      if (!sellerLat || !sellerLng) continue;

      const distance = calculateDistance(userLat, userLng, sellerLat, sellerLng);
      if (distance <= radiusKm) {
        const sellerObj = {
          _id: doc.id,
          ...data,
          distanceKm: Math.round(distance * 10) / 10,
          distanceText: formatDistance(distance),
          travelTimeText: formatTime(distance)
        };
        if (product) {
          const hasProduct = (sellerObj.products || []).some(
            p => p.name.toLowerCase().includes(product.toLowerCase())
          );
          if (!hasProduct) continue;
        }
        results.push(sellerObj);
      }
    }

    results.sort((a, b) => a.distanceKm - b.distanceKm);
    res.json({ success: true, count: results.length, sellers: results });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// PUT /api/sellers/online - seller goes online
router.put('/online', protect(['seller']), async (req, res) => {
  try {
    const db = req.app.get('db');
    const { location } = req.body;
    await db.collection('sellers').doc(req.user.id).update({
      isOnline: true,
      location: location || { lat: null, lng: null, address: '' },
      lastSeen: new Date().toISOString()
    });
    res.json({ success: true, message: 'سەرکەوتووانە ئەکتیف بوویت' });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// PUT /api/sellers/offline - seller goes offline
router.put('/offline', protect(['seller']), async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('sellers').doc(req.user.id).update({
      isOnline: false,
      lastSeen: new Date().toISOString()
    });
    res.json({ success: true, message: 'ئۆفلاین بوویت' });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// PUT /api/sellers/location - update location while online
router.put('/location', protect(['seller']), async (req, res) => {
  try {
    const db = req.app.get('db');
    const { location } = req.body;
    await db.collection('sellers').doc(req.user.id).update({
      location,
      lastSeen: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// PUT /api/sellers/profile - update profile
router.put('/profile', protect(['seller']), [
  body('name').optional().trim().isLength({ min: 2 }),
  body('description').optional().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const db = req.app.get('db');
    const { name, description, location } = req.body;
    const update = {};
    if (name) update.name = name;
    if (description !== undefined) update.description = description;
    if (location) update.location = location;

    await db.collection('sellers').doc(req.user.id).update(update);
    const doc = await db.collection('sellers').doc(req.user.id).get();
    const data = doc.data();
    delete data.password;
    res.json({ success: true, seller: { _id: doc.id, ...data } });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// GET /api/sellers/:id
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    const doc = await db.collection('sellers').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'فرۆشیار نەدۆزرایەوە' });
    const data = doc.data();
    delete data.password;
    res.json({ success: true, seller: { _id: doc.id, ...data } });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// POST /api/sellers/products - add product
router.post('/products', protect(['seller']), [
  body('name').trim().notEmpty().withMessage('ناوی کالا پێویستە'),
  body('price').isNumeric().withMessage('نرخ پێویستە')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const db = req.app.get('db');
    const { name, price, unit, image } = req.body;
    const product = {
      id: Date.now().toString(),
      name,
      price: Number(price),
      unit: unit || 'دانە',
      image: image || ''
    };

    await db.collection('sellers').doc(req.user.id).update({
      products: admin.firestore.FieldValue.arrayUnion(product)
    });

    const doc = await db.collection('sellers').doc(req.user.id).get();
    const data = doc.data();
    delete data.password;
    res.json({ success: true, seller: { _id: doc.id, ...data } });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// DELETE /api/sellers/products/:productId
router.delete('/products/:productId', protect(['seller']), async (req, res) => {
  try {
    const db = req.app.get('db');
    const doc = await db.collection('sellers').doc(req.user.id).get();
    const updatedProducts = (doc.data().products || []).filter(p => p.id !== req.params.productId);
    await db.collection('sellers').doc(req.user.id).update({ products: updatedProducts });

    const updated = await db.collection('sellers').doc(req.user.id).get();
    const data = updated.data();
    delete data.password;
    res.json({ success: true, seller: { _id: updated.id, ...data } });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// POST /api/sellers/:id/rate
router.post('/:id/rate', protect(['traveler']), [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('هەڵسەنگاندن دەبێت لە ١ تا ٥ بێت')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const db = req.app.get('db');
    const sellerRef = db.collection('sellers').doc(req.params.id);
    const sellerDoc = await sellerRef.get();
    if (!sellerDoc.exists) return res.status(404).json({ error: 'فرۆشیار نەدۆزرایەوە' });

    const seller = sellerDoc.data();
    const travelerId = req.user.id;

    if (seller.ratedBy && seller.ratedBy.includes(travelerId)) {
      return res.status(400).json({ error: 'پێشتر هەڵسەنگاندوویتە' });
    }

    const newCount = (seller.rating.count || 0) + 1;
    const newAvg = (((seller.rating.average || 0) * (seller.rating.count || 0)) + req.body.rating) / newCount;

    await sellerRef.update({
      rating: { average: Math.round(newAvg * 10) / 10, count: newCount },
      ratedBy: admin.firestore.FieldValue.arrayUnion(travelerId)
    });

    res.json({ success: true, rating: { average: Math.round(newAvg * 10) / 10, count: newCount } });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg) { return deg * (Math.PI / 180); }
function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} مەتر`;
  return `${Math.round(km * 10) / 10} کیلۆمەتر`;
}
function formatTime(km) {
  const mins = Math.round((km / 60) * 60);
  if (mins < 1) return 'کەمتر لە ١ خولەک';
  if (mins < 60) return `${mins} خولەک`;
  return `${Math.round(mins / 60)} کاتژمێر`;
}

module.exports = router;
