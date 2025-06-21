const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Receiver', required: true },
  billNumber: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  products: [
    {
      description: String,
      hsnCode: String,
      qty: Number,
      rate: Number,
      amount: Number,
    }
  ],
  tax: {
    cgst: Number,
    sgst: Number,
    igst: Number,
    roundOff: Number,
    totalBeforeTax: Number,
    totalAfterTax: Number,
    totalInWords: String,
  },
  qrCode: { type: String },
  pdfUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema); 