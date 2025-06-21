const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { user: req.user.id };
    if (search) {
      query = {
        ...query,
        description: { $regex: search, $options: 'i' },
      };
    }
    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const data = {
      user: req.user.id,
      description: req.body.description,
      hsnCode: req.body.hsnCode,
      rate: req.body.rate,
      isSuggestion: true,
    };
    const product = new Product(data);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 