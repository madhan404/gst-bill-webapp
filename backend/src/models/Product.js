const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  hsnCode: { type: String },
  rate: { type: Number },
  isSuggestion: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema); 