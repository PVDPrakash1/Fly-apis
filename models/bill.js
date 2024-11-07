const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  username: String,
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
    default: "active",
  },

});

const Bill = mongoose.model("Bill", billSchema);

module.exports = Bill;
