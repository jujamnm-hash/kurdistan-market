const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');
const jwt = require('jsonwebtoken');
const Seller = require('./models/Seller');

dotenv.config();

const app = express();

// Allowed origins: local dev + production frontend URL
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Trust proxy for Render/Netlify
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  validate: { xForwardedForHeader: false },
  message: { error: 'زۆر داواکاری نێردراوە، کەمێک چاوەڕێ بکە' }
});

app.use(limiter);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Socket.io - Real-time online sellers
const onlineSellers = new Map(); // sellerId -> { socketId, location, sellerData }

// Make io and onlineSellers accessible to routes
app.set('io', io);
app.set('onlineSellers', onlineSellers);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sellers', require('./routes/sellers'));
app.use('/api/travelers', require('./routes/travelers'));
app.use('/api/products', require('./routes/products'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    onlineSellers: onlineSellers.size,
    uptime: Math.floor(process.uptime()) + ' چرکە'
  });
});

io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  // Seller goes online
  socket.on('seller:online', async (data) => {
    try {
      const { sellerId, token, location } = data;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.id !== sellerId) {
        socket.emit('error', { message: 'توکەنی نادروست' });
        return;
      }

      const seller = await Seller.findById(sellerId).select('-password');
      if (!seller) {
        socket.emit('error', { message: 'فرۆشیار نەدۆزرایەوە' });
        return;
      }

      // Update seller location and online status
      seller.location = location;
      seller.isOnline = true;
      seller.lastSeen = new Date();
      await seller.save();

      onlineSellers.set(sellerId, {
        socketId: socket.id,
        location,
        sellerData: seller.toObject()
      });

      socket.sellerId = sellerId;

      // Broadcast to all that this seller is online
      io.emit('sellers:update', getOnlineSellersArray());
      socket.emit('seller:confirmed', { message: 'سەرکەوتووانە ئەکتیف بوویت' });

      console.log(`✅ Seller online: ${seller.name}`);
    } catch (err) {
      socket.emit('error', { message: 'هەڵە لە پشکنینی ناسنامە' });
    }
  });

  // Seller updates location
  socket.on('seller:updateLocation', async (data) => {
    const { sellerId, location } = data;
    if (onlineSellers.has(sellerId)) {
      const sellerInfo = onlineSellers.get(sellerId);
      sellerInfo.location = location;
      onlineSellers.set(sellerId, sellerInfo);

      await Seller.findByIdAndUpdate(sellerId, { location, lastSeen: new Date() });

      io.emit('sellers:update', getOnlineSellersArray());
    }
  });

  // Get all online sellers
  socket.on('sellers:getAll', () => {
    socket.emit('sellers:update', getOnlineSellersArray());
  });

  // Disconnect
  socket.on('disconnect', async () => {
    if (socket.sellerId) {
      onlineSellers.delete(socket.sellerId);
      await Seller.findByIdAndUpdate(socket.sellerId, {
        isOnline: false,
        lastSeen: new Date()
      });
      io.emit('sellers:update', getOnlineSellersArray());
      console.log(`❌ Seller offline: ${socket.sellerId}`);
    }
  });
});

function getOnlineSellersArray() {
  const arr = [];
  for (const [id, data] of onlineSellers) {
    arr.push({
      _id: id,
      ...data.sellerData,
      location: data.location,
      isOnline: true
    });
  }
  return arr;
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
