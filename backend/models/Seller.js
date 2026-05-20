const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'ناو پێویستە'],
    trim: true,
    minlength: [2, 'ناو دەبێت لانیکەم ٢ پیت بێت']
  },
  phone: {
    type: String,
    required: [true, 'ژمارەی تەلەفۆن پێویستە'],
    unique: true,
    match: [/^07[5-9][0-9]{8}$/, 'ژمارەی تەلەفۆن نادروستە']
  },
  password: {
    type: String,
    required: [true, 'وشەی نهێنی پێویستە'],
    minlength: [6, 'وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت']
  },
  profileImage: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'وەسف نابێت زیاتر لە ٥٠٠ پیت بێت']
  },
  products: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, default: 'دانە' },
    image: { type: String, default: '' }
  }],
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String, default: '' },
    road: { type: String, default: '' }
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  ratedBy: [{ type: String }],
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before save
sellerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
sellerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Seller', sellerSchema);
