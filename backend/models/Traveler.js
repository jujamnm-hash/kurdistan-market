const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const travelerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'ناو پێویستە'],
    trim: true
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
  savedSellers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

travelerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

travelerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Traveler', travelerSchema);
