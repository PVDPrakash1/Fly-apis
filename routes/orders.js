const express = require("express");
const router = express.Router();
const Order = require("../models/order"); // Assuming you have a Cart model
const Cart = require("../models/cart");
const LiveOrder = require("../models/liveOrder");

router.get("/live/:tableNo/:phone", async (req, res) => {
  const { tableNo, phone } = req.params;
  const orders = await LiveOrder.find({tableNo, phone});

  res.json({
    orders: orders,
  });
});

router.get("/livefoodorders/:tableNo", async (req, res) => {
  const { tableNo } = req.params;
  const orders = await LiveOrder.find({tableNo: tableNo, foodType: { $in: ['Food', 'Desserts']  }});

  res.json({
    orders: orders,
  });
});

router.get("/livedrinkorders/:tableNo", async (req, res) => {
  const { tableNo } = req.params;
  const orders = await LiveOrder.find({tableNo: tableNo, foodType: { $in: ['Drinks', 'Beverages']  }});

  res.json({
    orders: orders,
  });
});

router.get("/liveorders/:tableNo", async (req, res) => {
  const { tableNo } = req.params;
  const orders = await LiveOrder.find({tableNo});

  res.json({
    orders: orders,
  });
});

router.put('/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // new status from request body

  try {
    // Find the order and update the status
    const updatedOrder = await LiveOrder.findByIdAndUpdate(
      orderId,
      { status: status },
      { new: true } // Return the updated document
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error', error });
  }
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
      productImage: item.productImage,
      productDescription: item.productDescription,
      foodType: item.foodType,
      price: item.price,
      quantity: item.quantity,
      totalPrice: item.price * item.quantity,
      tableNo,
      phone,
      customerName,
      total,
      orderStatus: "placed",
    }));

    await LiveOrder.insertMany(liveOrders);

    // Clear the cart
    await Cart.deleteMany({ tableNo });

    return res.status(200).json({ message: "Order placed successfully!" });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
