const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/sellers - get all sellers (for map)
router.get('/', async (req, res) => {
  try {
    const sellers = await Seller.find({}).select('-password');
    res.json({ success: true, sellers });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// GET /api/sellers/online - only online sellers
router.get('/online', (req, res) => {
  const onlineSellers = req.app.get('onlineSellers');
  const arr = [];
  for (const [id, data] of onlineSellers) {
    arr.push({
      _id: id,
      ...data.sellerData,
      location: data.location,
      isOnline: true
    });
  }
  res.json({ success: true, sellers: arr });
});

// GET /api/sellers/nearby?lat=&lng=&radius=&product=
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 100, product } = req.query;

    // Default to Kurdistan center if no location provided
    const userLat = lat ? parseFloat(lat) : 36.1901;
    const userLng = lng ? parseFloat(lng) : 44.0091;
    const radiusKm = parseFloat(radius);

    // Get online sellers from memory
    const onlineSellers = req.app.get('onlineSellers');
    let results = [];

    for (const [id, data] of onlineSellers) {
      const sellerLat = data.location.lat;
      const sellerLng = data.location.lng;
      if (!sellerLat || !sellerLng) continue;
      const distance = calculateDistance(userLat, userLng, sellerLat, sellerLng);

      if (distance <= radiusKm) {
        const sellerObj = {
          _id: id,
          ...data.sellerData,
          location: data.location,
          isOnline: true,
          distanceKm: Math.round(distance * 10) / 10,
          distanceText: formatDistance(distance),
          travelTimeText: formatTime(distance)
        };

        // Filter by product if provided
        if (product) {
          const hasProduct = sellerObj.products && sellerObj.products.some(
            p => p.name.toLowerCase().includes(product.toLowerCase())
          );
          if (!hasProduct) continue;
        }

        results.push(sellerObj);
      }
    }

    // Sort by distance
    results.sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ success: true, count: results.length, sellers: results });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// GET /api/sellers/:id
router.get('/:id', async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id).select('-password');
    if (!seller) return res.status(404).json({ error: 'فرۆشیار نەدۆزرایەوە' });
    res.json({ success: true, seller });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// PUT /api/sellers/profile - update seller profile
router.put('/profile', protect(['seller']), [
  body('name').optional().trim().isLength({ min: 2 }),
  body('description').optional().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, location } = req.body;
    const seller = await Seller.findByIdAndUpdate(
      req.user.id,
      { name, description, location },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, seller });
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
    const { name, price, unit, image } = req.body;
    const seller = await Seller.findByIdAndUpdate(
      req.user.id,
      { $push: { products: { name, price, unit, image } } },
      { new: true }
    ).select('-password');
    res.json({ success: true, seller });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// DELETE /api/sellers/products/:productId
router.delete('/products/:productId', protect(['seller']), async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.user.id,
      { $pull: { products: { _id: req.params.productId } } },
      { new: true }
    ).select('-password');
    res.json({ success: true, seller });
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
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ error: 'فرۆشیار نەدۆزرایەوە' });

    // Prevent duplicate rating
    const travelerId = String(req.user.id);
    if (seller.ratedBy && seller.ratedBy.includes(travelerId)) {
      return res.status(400).json({ error: 'پێشتر هەڵسەنگاندوویتە' });
    }

    const newCount = seller.rating.count + 1;
    const newAvg = ((seller.rating.average * seller.rating.count) + req.body.rating) / newCount;

    seller.rating = { average: Math.round(newAvg * 10) / 10, count: newCount };
    seller.ratedBy = [...(seller.ratedBy || []), travelerId];
    await seller.save();

    res.json({ success: true, rating: seller.rating });
  } catch (err) {
    res.status(500).json({ error: 'هەڵەی سێرڤەر' });
  }
});

// Utility: Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} مەتر`;
  return `${Math.round(km * 10) / 10} کیلۆمەتر`;
}

function formatTime(km) {
  // Average car speed 80 km/h
  const hours = km / 80;
  if (hours < 1 / 60) return 'کەمتر لە ١ خولەک';
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `نزیکەی ${mins} خولەک`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `نزیکەی ${h} کاتژمێر ${m > 0 ? `و ${m} خولەک` : ''}`;
}

module.exports = router;
