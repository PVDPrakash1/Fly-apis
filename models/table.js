const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  tableNo: { type: Number, required: true },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Waiter",
    default: null,
  }, // If null, it's available
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
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "inactive",
  },
});

const Table = mongoose.model("Table", tableSchema);

module.exports = Table;
