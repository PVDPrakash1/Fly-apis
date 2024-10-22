const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  tableNo: { type: Number, required: true },
  isAssigned: {
    type: Boolean,
    default: false,
  },
  assignedWaiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waiter', // Reference to the Waiter model
    default: null,
  },
  capacity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'cleaning', 'reserved'],
    default: 'available',
  },
  assignedTime: {
    type: Date,
    default: null,
  },// If null, it's available
  qrCodeImage: String,
  qrCodeThumbnail: String,
  qrCodeUrl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Table = mongoose.model("Table", tableSchema);

module.exports = Table;
