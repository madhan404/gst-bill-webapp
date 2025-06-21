const Receiver = require('../models/Receiver');

exports.getReceivers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { user: req.user.id };
    if (search) {
      query = {
        ...query,
        name: { $regex: search, $options: 'i' },
      };
    }
    const receivers = await Receiver.find(query);
    res.json(receivers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addReceiver = async (req, res) => {
  try {
    const data = {
      user: req.user.id,
      name: req.body.name,
      address: req.body.address,
      phone: req.body.phone,
      email: req.body.email,
      gstNumber: req.body.gstNumber,
    };
    const receiver = new Receiver(data);
    await receiver.save();
    res.status(201).json(receiver);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateReceiver = async (req, res) => {
  try {
    const receiver = await Receiver.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' });
    res.json(receiver);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteReceiver = async (req, res) => {
  try {
    const receiver = await Receiver.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' });
    res.json({ message: 'Receiver deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 