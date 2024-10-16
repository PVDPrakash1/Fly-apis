const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  position: Number,
  image: String,
  thumbnail: String,
  foodType: { type: mongoose.Schema.Types.ObjectId, ref: "FoodType", required: true },
  foodTypeName: String,
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

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
