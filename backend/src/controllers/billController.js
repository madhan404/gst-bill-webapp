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
    // QR (right, always clear of address)
    const qrX = doc.page.width - 110;
    const qrY = y;
    try {
      doc.image(qrCodeDataUrl, qrX, qrY, { width: 70 });
    } catch {}
    // Company details (centered, responsive)
    const companyDetailsLeft = 130;
    const companyDetailsRight = qrX - 10;
    const companyDetailsWidth = companyDetailsRight - companyDetailsLeft;
    let companyDetailsY = y;
    doc.fontSize(20).font('Helvetica-Bold').fillColor(blue).text('TAX INVOICE', companyDetailsLeft, companyDetailsY, { align: 'center', width: companyDetailsWidth });
    companyDetailsY += 28;
    doc.fontSize(17).font('Helvetica-Bold').fillColor(textColor).text(company.companyName || '', companyDetailsLeft, companyDetailsY, { align: 'center', width: companyDetailsWidth });
    companyDetailsY += 18;
    const companyAddress = [
        company.address || '',
        `GSTIN: ${company.gstNumber || ''}`,
        `Email: ${company.email || ''}`,
        `Phone: ${company.phone || ''}`
    ].filter(line => line.trim()).join('\n');
    doc.fontSize(10).font('Helvetica').fillColor(textColor)
      .text(companyAddress, companyDetailsLeft, companyDetailsY, { align: 'center', width: companyDetailsWidth });
    companyDetailsY += doc.heightOfString(companyAddress, { width: companyDetailsWidth }) + 10;
    y = Math.max(y + 60, companyDetailsY); // Move y down for next section

    // --- RECEIVER SECTION ---
    const receiverBoxY = y;
    let receiverInfoHeight = 28; // Initial height for title
    
    const receiverName = receiver.name || '';
    const receiverAddress = receiver.address || '';
    const receiverGstin = receiver.gstNumber || '';
    const receiverEmail = receiver.email || '';
    const receiverPhone = receiver.phone || '';

    receiverInfoHeight += doc.heightOfString(receiverAddress, { width: 220 }) + 2; // Address height
    if(receiverName) receiverInfoHeight += 16;
    if(receiverGstin) receiverInfoHeight += 16;
    if(receiverEmail) receiverInfoHeight += 16;
    if(receiverPhone) receiverInfoHeight += 16;
    const receiverBoxHeight = Math.max(85, receiverInfoHeight);

    doc.roundedRect(40, receiverBoxY, pageWidth, receiverBoxHeight, 6).fillAndStroke(lightGray, blue);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(blue).text('Details of Receiver / Billed to', 50, receiverBoxY + 8);
    
    const receiverLeftX = 50;
    const receiverRightX = 350;
    let receiverY = receiverBoxY + 28;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor);
    doc.text('Name:', receiverLeftX, receiverY).font('Helvetica').text(receiverName, receiverLeftX + 60, receiverY);
    receiverY += 16;
    doc.font('Helvetica-Bold').text('Address:', receiverLeftX, receiverY).font('Helvetica').text(receiverAddress, receiverLeftX + 60, receiverY, { width: 220 });
    receiverY += doc.heightOfString(receiverAddress, { width: 220 });
    doc.font('Helvetica-Bold').text('GSTIN:', receiverLeftX, receiverY).font('Helvetica').text(receiverGstin, receiverLeftX + 60, receiverY);
    receiverY += 16;
    if (receiverEmail) {
      doc.font('Helvetica-Bold').text('Email:', receiverLeftX, receiverY).font('Helvetica').text(receiverEmail, receiverLeftX + 60, receiverY);
      receiverY += 16;
    }
    if (receiverPhone) {
      doc.font('Helvetica-Bold').text('Phone:', receiverLeftX, receiverY).font('Helvetica').text(receiverPhone, receiverLeftX + 60, receiverY);
    }

    receiverY = receiverBoxY + 28;
    doc.font('Helvetica-Bold').text('Bill No:', receiverRightX, receiverY).font('Helvetica').text(bill.billNumber || '', receiverRightX + 50, receiverY);
    receiverY += 16;
    doc.font('Helvetica-Bold').text('Date:', receiverRightX, receiverY).font('Helvetica').text(new Date(bill.date).toLocaleDateString(), receiverRightX + 50, receiverY);
    
    y += receiverBoxHeight + 20;

    // --- PRODUCT TABLE ---
    const tableTopY = y;
    doc.roundedRect(40, tableTopY, pageWidth, 28, 3).fillAndStroke(blue, blue);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10);
    doc.text('Sl.', 50, tableTopY + 8, { width: 30, align: 'left' })
       .text('Product Description', 90, tableTopY + 8, { width: 160, align: 'left' })
       .text('HSN Code', 260, tableTopY + 8, { width: 70, align: 'center' })
       .text('Qty', 340, tableTopY + 8, { width: 50, align: 'center' })
       .text('Rate', 400, tableTopY + 8, { width: 60, align: 'right' })
       .text('Amount', 470, tableTopY + 8, { width: 70, align: 'right' });
    y = tableTopY + 28;
    bill.products.forEach((product, index) => {
      const rowHeight = Math.max(22, doc.heightOfString(product.description, { width: 160 }) + 8);
      if (index % 2 === 0) doc.rect(40, y, pageWidth, rowHeight).fill(lightGray);
      doc.fillColor(textColor).font('Helvetica').fontSize(10)
        .text(index + 1, 50, y + 7, { width: 30, align: 'left' })
        .text(product.description, 90, y + 7, { width: 160, align: 'left' })
        .text(product.hsnCode || '', 260, y + 7, { width: 70, align: 'center' })
        .text(product.qty.toString(), 340, y + 7, { width: 50, align: 'center' })
        .text(Number(product.rate).toFixed(2), 400, y + 7, { width: 60, align: 'right' })
        .text(Number(product.amount).toFixed(2), 470, y + 7, { width: 70, align: 'right' });
      y += rowHeight;
    });
    y += 10;

    
    // --- TOTALS SECTION ---
    const totalsY = y;
    const totalsBoxHeight = 85;
    doc.roundedRect(40, totalsY, pageWidth, totalsBoxHeight, 6).fillAndStroke(lightGray, blue);
    
    const leftColX = 50;
    const rightColX = 300;
    let totalsLineY = totalsY + 12;
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor);
    doc.text('Total Amount Before Tax:', leftColX, totalsLineY).font('Helvetica').text(bill.totalBeforeTax.toFixed(2), leftColX + 150, totalsLineY, { align: 'right', width: 60 });
    totalsLineY += 16;
    doc.font('Helvetica-Bold').text(`CGST (${bill.tax.cgstRate || 2.5}%):`, leftColX, totalsLineY).font('Helvetica').text(bill.tax.cgst.toFixed(2), leftColX + 150, totalsLineY, { align: 'right', width: 60 });
    totalsLineY += 16;
    doc.font('Helvetica-Bold').text(`SGST (${bill.tax.sgstRate || 2.5}%):`, leftColX, totalsLineY).font('Helvetica').text(bill.tax.sgst.toFixed(2), leftColX + 150, totalsLineY, { align: 'right', width: 60 });
    
    totalsLineY = totalsY + 12;
    doc.font('Helvetica-Bold').text('IGST:', rightColX, totalsLineY).font('Helvetica').text(bill.tax.igst.toFixed(2), rightColX + 150, totalsLineY, { align: 'right', width: 60 });
    totalsLineY += 16;
    doc.font('Helvetica-Bold').text('Round Off:', rightColX, totalsLineY).font('Helvetica').text(bill.tax.roundOff.toFixed(2), rightColX + 150, totalsLineY, { align: 'right', width: 60 });
    
    doc.rect(rightColX - 10, totalsLineY + 12, 250, 2).fill(blue);
    totalsLineY += 22;
    doc.font('Helvetica-Bold').fontSize(12).text('Total Amount After Tax:', rightColX, totalsLineY).font('Helvetica-Bold').text(bill.totalAfterTax.toFixed(2), rightColX + 150, totalsLineY, { align: 'right', width: 60 });
    
    y += totalsBoxHeight + 20;
    
    // --- AMOUNT IN WORDS ---
    const wordsText = (numberToWords(Math.round(bill.totalAfterTax)) || '') + ' Only';
    const wordsTextHeight = doc.heightOfString(wordsText, { width: 380 });
    const wordsBoxHeight = Math.max(28, wordsTextHeight + 16);

    doc.roundedRect(40, y, pageWidth, wordsBoxHeight, 3).fillAndStroke(lightGray, blue);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor)
       .text('Amount in Words:', 50, y + 8);
    doc.font('Helvetica').text(wordsText, 160, y + 8, { width: 380 });
    y += wordsBoxHeight + 10;
    // --- BANK DETAILS & SIGNATURE ---
    const bankY = y;
    const bankBoxHeight = 70;
    doc.roundedRect(40, bankY, pageWidth, bankBoxHeight, 6).fillAndStroke(lightGray, blue);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(blue).text('Bank Details:', 50, bankY + 8);
    
    let bankLineY = bankY + 28;
    doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor)
      .text('Bank:', 50, bankLineY).font('Helvetica').text(company.bankName || '', 100, bankLineY)
      .font('Helvetica-Bold').text('Branch:', 250, bankLineY).font('Helvetica').text(company.branch || '', 300, bankLineY);
    bankLineY += 16;
    doc.font('Helvetica-Bold').text('Ac No.:', 50, bankLineY).font('Helvetica').text(company.accountNumber || '', 100, bankLineY)
      .font('Helvetica-Bold').text('IFSC:', 250, bankLineY).font('Helvetica').text(company.ifsc || '', 300, bankLineY);
    
    doc.font('Helvetica-Bold').text('For ' + (company.companyName || ''), doc.page.width - 160, bankY + 28, {align: 'center', width: 100 });
       
    doc.font('Helvetica').text(company.proprietorName || '', doc.page.width - 160, bankY + bankBoxHeight + 5, {align: 'center', width: 100 });
    doc.font('Helvetica-Bold').text('Authorised Signatory', doc.page.width - 160, bankY + bankBoxHeight + 20, {align: 'center', width: 100 });

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
    
    // Calculate taxes using rates from request or default
    const cgstRate = (req.body.tax?.cgstRate || 2.5) / 100;
    const sgstRate = (req.body.tax?.sgstRate || 2.5) / 100;
    bill.tax.cgst = totalBeforeTax * cgstRate;
    bill.tax.sgst = totalBeforeTax * sgstRate;
    bill.tax.cgstRate = req.body.tax?.cgstRate || 2.5;
    bill.tax.sgstRate = req.body.tax?.sgstRate || 2.5;
    
    // Calculate total after tax
    const totalWithTaxes = totalBeforeTax + bill.tax.cgst + bill.tax.sgst;
    
    // Round off to nearest rupee
    const roundedTotal = Math.round(totalWithTaxes);
    bill.tax.roundOff = roundedTotal - totalWithTaxes;
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
    let billData = req.body;

    // Recalculate totals and taxes on update
    let totalBeforeTax = 0;
    billData.products.forEach(product => {
      // Ensure values are numbers before calculation
      product.qty = Number(product.qty || 0);
      product.rate = Number(product.rate || 0);
      product.amount = product.qty * product.rate;
      totalBeforeTax += product.amount;
    });

    billData.totalBeforeTax = totalBeforeTax;
    
    const cgstRate = (billData.tax?.cgstRate || 2.5) / 100;
    const sgstRate = (billData.tax?.sgstRate || 2.5) / 100;
    billData.tax.cgst = totalBeforeTax * cgstRate;
    billData.tax.sgst = totalBeforeTax * sgstRate;
    
    const totalWithTaxes = totalBeforeTax + billData.tax.cgst + billData.tax.sgst;
    const roundedTotal = Math.round(totalWithTaxes);
    billData.tax.roundOff = roundedTotal - totalWithTaxes;
    billData.totalAfterTax = roundedTotal;

    // Regenerate PDF
    const pdfUrl = await generateBillPDF({ ...billData, _id: req.params.id });
    billData.pdfUrl = pdfUrl;

    const updatedBill = await Bill.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      billData,
      { new: true }
    ).populate('receiver company');

    if (!updatedBill) return res.status(404).json({ message: 'Bill not found' });
    
    res.json(updatedBill);
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