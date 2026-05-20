const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

const app = express();
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  validate: { xForwardedForHeader: false },
  message: { error: 'زۆر داواکاری نێردراوە، کەمێک چاوەڕێ بکە' }
});

app.use(limiter);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Make db accessible to routes
app.set('db', db);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sellers', require('./routes/sellers'));
app.use('/api/travelers', require('./routes/travelers'));
app.use('/api/products', require('./routes/products'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.floor(process.uptime()) + ' چرکە' });
});

exports.api = functions.region('europe-west1').https.onRequest(app);
