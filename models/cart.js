const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  tableNo: { type: String, required: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productDescription: { type: String, required: false },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);
