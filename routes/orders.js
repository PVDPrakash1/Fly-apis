const express = require("express");
const router = express.Router();
const Order = require("../models/order"); // Assuming you have a Cart model
const Cart = require("../models/cart");

router.get("/live", async (req, res) => {
  const orders = await Order.find({});

  res.json({
    orders: orders,
  });
});

router.post("/placeOrder", async (req, res) => {
  const { tableNo, phone, customerName, total } = req.body;

  try {
    // Find all items in the cart for this user/table
    const cartItems = await Cart.find({ tableNo });

    console.log(cartItems);

    if (!cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Move all cart items to liveOrders table
    const liveOrders = cartItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productDescription: item.productDescription,
      price: item.price,
      quantity: item.quantity,
      totalPrice: item.price * item.quantity,
      tableNo,
      phone,
      customerName,
      total,
      orderStatus: "placed",
    }));

    await Order.insertMany(liveOrders);

    // Clear the cart
    await Cart.deleteMany({ tableNo });

    return res.status(200).json({ message: "Order placed successfully!" });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
