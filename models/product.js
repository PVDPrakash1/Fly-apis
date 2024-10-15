const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  position: Number,
  image: String,
  thumbnail: String,
  description: String,
  type: {
    type: String,
    enum: ["veg", "nonVeg"],
    default: "veg",
  },
  order: Number,
  photo: String,
  price: String,
  foodType: { type: mongoose.Schema.Types.ObjectId, ref: "FoodType", required: true },
  foodTypeName: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  categoryName: String,
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

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
