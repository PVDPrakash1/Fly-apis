const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
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

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
