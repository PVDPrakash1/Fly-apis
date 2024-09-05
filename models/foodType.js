const mongoose = require("mongoose");

const foodTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  order: Number,
  photo: String,
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

const FoodType = mongoose.model("FoodType", foodTypeSchema);

module.exports = FoodType;
