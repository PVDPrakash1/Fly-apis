const mongoose = require("mongoose");

const kitchenSchema = new mongoose.Schema({
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

const Kitchen = mongoose.model("Kitchen", kitchenSchema);

module.exports = Kitchen;
