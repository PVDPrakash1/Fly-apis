const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  tableNo: { type: String, required: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  productDescription: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["placed", "prepare", "notAvailable", "cancelled", "readToserve", "paymentPending", "completed"],
    default: "placed",
  },
});

module.exports = mongoose.model('Order', orderSchema);
