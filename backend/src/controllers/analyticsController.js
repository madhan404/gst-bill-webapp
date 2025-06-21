const Bill = require('../models/Bill');

exports.getSummary = async (req, res) => {
  try {
    const bills = await Bill.find({ user: req.user.id });
    const totalBills = bills.length;
    const totalAmount = bills.reduce((sum, b) => sum + (b.tax?.totalAfterTax || 0), 0);
    const totalTax = bills.reduce((sum, b) => sum + ((b.tax?.cgst || 0) + (b.tax?.sgst || 0) + (b.tax?.igst || 0)), 0);
    res.json({ totalBills, totalAmount, totalTax });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const bills = await Bill.find({ user: req.user.id });
    const monthly = {};
    bills.forEach(bill => {
      const month = new Date(bill.date).toISOString().slice(0,7); // YYYY-MM
      if (!monthly[month]) monthly[month] = { total: 0, count: 0 };
      monthly[month].total += bill.tax?.totalAfterTax || 0;
      monthly[month].count += 1;
    });
    res.json(monthly);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 