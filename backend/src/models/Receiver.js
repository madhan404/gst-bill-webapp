const mongoose = require('mongoose');

const receiverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  gstNumber: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Receiver', receiverSchema); 