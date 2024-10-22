const mongoose = require("mongoose");

const barSchema = new mongoose.Schema({
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

const Bar = mongoose.model("Bar", barSchema);

module.exports = Bar;
