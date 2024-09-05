const mongoose = require("mongoose");

const waiterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  phone: String,
  password:String,
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

const Waiter = mongoose.model("Category", waiterSchema);

module.exports = Waiter;
