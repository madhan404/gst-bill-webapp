const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  address: { type: String, required: true },
  gstNumber: { type: String, required: true },
  phone: { type: String },
  proprietorName: { type: String },
  email: { type: String },
  logo: { type: String },
  bankName: { type: String },
  accountNumber: { type: String },
  ifsc: { type: String },
  branch: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema); 