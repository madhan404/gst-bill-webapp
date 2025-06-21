const Bill = require('../models/Bill');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Company = require('../models/Company');
const Receiver = require('../models/Receiver');
const QRCode = require('qrcode');
const { numberToWords } = require('./utils');

exports.getBills = async (req, res) => {
  try {
    const bills = await Bill.find({ user: req.user.id })
      .populate('receiver')
      .populate('company')
      .sort({ date: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, user: req.user.id })
      .populate('receiver')
      .populate('company');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

async function generateBillPDF(bill) {
  try {
    const billsDir = path.join(__dirname, '../../public/bills');
    if (!fs.existsSync(billsDir)) fs.mkdirSync(billsDir, { recursive: true });
    const filePath = path.join(billsDir, `${bill._id}.pdf`);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(fs.createWriteStream(filePath));

    // Ensure tax object exists
    bill.tax = bill.tax || {};
    bill.totalBeforeTax = bill.totalBeforeTax || 0;
    bill.totalAfterTax = bill.totalAfterTax || 0;
    bill.tax.cgst = bill.tax.cgst || 0;
    bill.tax.sgst = bill.tax.sgst || 0;
    bill.tax.igst = bill.tax.igst || 0;
    bill.tax.roundOff = bill.tax.roundOff || 0;

    // Fetch full company and receiver details
    const company = await Company.findById(bill.company);
    const receiver = await Receiver.findById(bill.receiver);

    // Generate QR code
    const qrData = JSON.stringify({
      billNo: bill.billNumber,
      date: bill.date,
      amount: bill.totalAfterTax,
      company: company.companyName,
      receiver: receiver.name
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    // Colors
    const blue = '#2563eb';
    const lightGray = '#f3f4f6';
    const textColor = '#222';
    const pageWidth = doc.page.width - 80;
    const centerX = 40 + pageWidth / 2;
    let y = 40;

    // --- HEADER ---
    // Logo (left)
    if (company.logo) {
      try {
        const logoData = company.logo.replace(/^data:image\/\w+;base64,/, '');
        const logoBuffer = Buffer.from(logoData, 'base64');
        doc.image(logoBuffer, 50, y, { width: 60 });
      } catch {}
    }
    // QR (right)
    try {
      doc.image(qrCodeDataUrl, doc.page.width - 120, y, { width: 70 });
    } catch {}
    // Company details (centered)
    doc.fontSize(22).font('Helvetica-Bold').fillColor(blue).text('TAX INVOICE', centerX, y, { align: 'center' });
    y += 28;
    doc.fontSize(14).font('Helvetica-Bold').fillColor(textColor).text(company.companyName || '', centerX, y, { align: 'center' });
    y += 18;
    doc.fontSize(10).font('Helvetica').fillColor(textColor)
      .text(company.address || '', centerX, y, { align: 'center' });
    y += 14;
    doc.text(`GSTIN: ${company.gstNumber || ''}`, centerX, y, { align: 'center' });
    y += 12;
    doc.text(`Prop: ${company.proprietorName || ''}`, centerX, y, { align: 'center' });
    y += 12;
    doc.text(`Phone: ${company.phone || ''}`, centerX, y, { align: 'center' });
    y += 30;

    // --- RECEIVER SECTION ---
    doc.roundedRect(40, y, pageWidth, 70, 6).fillAndStroke(lightGray, blue);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(blue).text('Details of Receiver / Billed to', 50, y + 8);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor)
      .text('Name:', 50, y + 26).font('Helvetica').text(receiver.name || '', 110, y + 26)
      .font('Helvetica-Bold').text('Address:', 50, y + 40).font('Helvetica').text(receiver.address || '', 110, y + 40, { width: 300 })
      .font('Helvetica-Bold').text('GSTIN:', 50, y + 54).font('Helvetica').text(receiver.gstNumber || '', 110, y + 54);
    // Email/Phone if present
    let rx = 50;
    if (receiver.email) {
      doc.font('Helvetica-Bold').text('Email:', 320, y + 26).font('Helvetica').text(receiver.email, 370, y + 26);
      rx = 320;
    }
    if (receiver.phone) {
      doc.font('Helvetica-Bold').text('Phone:', rx, y + 54).font('Helvetica').text(receiver.phone, rx + 50, y + 54);
    }
    // Bill No/Date (right)
    doc.font('Helvetica-Bold').text('Bill No:', doc.page.width - 200, y + 26).font('Helvetica').text(bill.billNumber || '', doc.page.width - 140, y + 26);
    doc.font('Helvetica-Bold').text('Date:', doc.page.width - 200, y + 54).font('Helvetica').text(new Date(bill.date).toLocaleDateString(), doc.page.width - 140, y + 54);
    y += 90;

    // --- PRODUCT TABLE ---
    doc.roundedRect(40, y, pageWidth, 28, 3).fillAndStroke(blue, blue);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10);
    doc.text('Sl.', 50, y + 8).text('Product Description', 90, y + 8).text('HSN Code', 260, y + 8).text('Qty', 340, y + 8).text('Rate', 400, y + 8).text('Amount', 470, y + 8);
    y += 28;
    bill.products.forEach((product, index) => {
      if (index % 2 === 0) doc.rect(40, y, pageWidth, 22).fill(lightGray);
      doc.fillColor(textColor).font('Helvetica').fontSize(10)
        .text(index + 1, 50, y + 7)
        .text(product.description, 90, y + 7)
        .text(product.hsn || '', 260, y + 7)
        .text(product.qty.toString(), 340, y + 7)
        .text(product.rate.toFixed(2), 400, y + 7)
        .text(product.amount.toFixed(2), 470, y + 7);
      y += 22;
    });
    y += 10;

    // --- AMOUNT IN WORDS ---
    doc.roundedRect(40, y, pageWidth, 28, 3).fillAndStroke(lightGray, blue);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor).text('Amount in Words:', 50, y + 8).font('Helvetica').text(numberToWords(bill.totalAfterTax) + ' Only', 160, y + 8);
    y += 38;

    // --- TAX CALCULATIONS ---
    doc.roundedRect(40, y, pageWidth, 70, 6).fillAndStroke(lightGray, blue);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor)
      .text('Total Amount Before Tax:', 50, y + 12).font('Helvetica').text(bill.totalBeforeTax.toFixed(2), 200, y + 12)
      .font('Helvetica-Bold').text('CGST:', 50, y + 28).font('Helvetica').text(bill.tax.cgst.toFixed(2), 200, y + 28)
      .font('Helvetica-Bold').text('SGST:', 50, y + 44).font('Helvetica').text(bill.tax.sgst.toFixed(2), 200, y + 44)
      .font('Helvetica-Bold').text('IGST:', 300, y + 12).font('Helvetica').text(bill.tax.igst.toFixed(2), 350, y + 12)
      .font('Helvetica-Bold').text('Round Off:', 300, y + 28).font('Helvetica').text(bill.tax.roundOff.toFixed(2), 350, y + 28)
      .font('Helvetica-Bold').text('Total Amount After Tax:', 300, y + 44).font('Helvetica').text(bill.totalAfterTax.toFixed(2), 450, y + 44);
    y += 90;

    // --- BANK DETAILS & SIGNATURE ---
    doc.roundedRect(40, y, pageWidth, 60, 6).fillAndStroke(lightGray, blue);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(blue).text('Bank Details:', 50, y + 8);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor)
      .text('Bank:', 50, y + 28).font('Helvetica').text(company.bankName || '', 100, y + 28)
      .font('Helvetica-Bold').text('Branch:', 250, y + 28).font('Helvetica').text(company.branch || '', 300, y + 28)
      .font('Helvetica-Bold').text('Ac No.:', 50, y + 44).font('Helvetica').text(company.accountNumber || '', 100, y + 44)
      .font('Helvetica-Bold').text('IFSC:', 250, y + 44).font('Helvetica').text(company.ifsc || '', 300, y + 44);
    doc.font('Helvetica-Bold').text('For', doc.page.width - 140, y + 28).text('Authorised Signatory', doc.page.width - 140, y + 44);

    doc.end();
    return `/bills/${bill._id}.pdf`;
  } catch (err) {
    console.error('PDF generation error:', err);
    throw err;
  }
}

exports.createBill = async (req, res) => {
  try {
    const bill = new Bill({
      ...req.body,
      user: req.user.id,
      tax: {
        cgst: 0,
        sgst: 0,
        igst: 0,
        roundOff: 0
      },
      totalBeforeTax: 0,
      totalAfterTax: 0
    });

    // Calculate totals
    let totalBeforeTax = 0;
    bill.products.forEach(product => {
      product.amount = (product.qty || 0) * (product.rate || 0);
      totalBeforeTax += product.amount;
    });

    bill.totalBeforeTax = totalBeforeTax;
    
    // Calculate taxes
    const taxRate = 0.09; // 9% each for CGST and SGST
    bill.tax.cgst = totalBeforeTax * taxRate;
    bill.tax.sgst = totalBeforeTax * taxRate;
    
    // Calculate total after tax
    bill.totalAfterTax = totalBeforeTax + bill.tax.cgst + bill.tax.sgst;
    
    // Round off to nearest rupee
    const roundedTotal = Math.round(bill.totalAfterTax);
    bill.tax.roundOff = roundedTotal - bill.totalAfterTax;
    bill.totalAfterTax = roundedTotal;

    // Generate PDF
    const pdfUrl = await generateBillPDF(bill);
    bill.pdfUrl = pdfUrl;

    await bill.save();
    res.status(201).json(bill);
  } catch (err) {
    console.error('Create bill error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json({ message: 'Bill deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 