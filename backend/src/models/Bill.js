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
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    totalBeforeTax: { type: Number, default: 0 },
    totalAfterTax: { type: Number, default: 0 },
    totalInWords: { type: String, default: '' },
    cgstRate: { type: Number, default: 2.5 },
    sgstRate: { type: Number, default: 2.5 }
  },
  qrCode: { type: String },
  pdfUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema); 