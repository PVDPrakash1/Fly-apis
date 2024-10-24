const mongoose = require("mongoose");

const waiterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  phone: String,
  username: String,
  password:String,
  image: String,
  thumbnail: String,
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
    default: "active",
  },

});

const Waiter = mongoose.model("Waiter", waiterSchema);

module.exports = Waiter;
