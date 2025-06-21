const Company = require('../models/Company');

exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createOrUpdateCompany = async (req, res) => {
  try {
    const data = {
      user: req.user.id,
      companyName: req.body.companyName,
      address: req.body.address,
      gstNumber: req.body.gstNumber,
      phone: req.body.phone,
      proprietorName: req.body.proprietorName,
      email: req.body.email,
      logo: req.body.logo, // handle file upload separately
      bankName: req.body.bankName,
      accountNumber: req.body.accountNumber,
      ifsc: req.body.ifsc,
      branch: req.body.branch,
    };
    let company = await Company.findOne({ user: req.user.id });
    if (company) {
      company = await Company.findOneAndUpdate({ user: req.user.id }, data, { new: true });
      return res.json(company);
    }
    company = new Company(data);
    await company.save();
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 