const express = require("express");
const router = express.Router();
const Cart = require("../models/cart"); // Assuming you have a Cart model

router.get('/live', async (req, res) => {
    const cartItems = await Cart.find({  });
  
    res.json({
      cartItems: cartItems,
    });
  });

// Add to Cart Route
router.post("/add", async (req, res) => {
  const { tableNo, customerName, phone, productId, productName,  productDescription, price, action } = req.body;

  try {
    // Check if the item already exists in the cart
    const existingItem = await Cart.findOne({
      productId,
      tableNo,
      phone,
    });

    if (existingItem) {
      // Update the quantity of the existing item
      existingItem.quantity = action == 'add' ? parseInt(existingItem.quantity) + 1 : parseInt(existingItem.quantity) - 1; // You can change this logic as per your needs
      await existingItem.save();
      return res.json({
        message: "Item quantity updated",
        cartItem: existingItem,
      });
    } else {
      // Create a new cart item
      const newCartItem = new Cart({
        tableNo,
        customerName,
        phone,
        productId,
        productName,
        productDescription,
        price,
        quantity:1,
      });

      // Save to the database
      await newCartItem.save();
      res.json({ message: "Item added to cart", cartItem: newCartItem });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

router.delete('/remove/:productId/:tableNo/:phone', async (req, res) => {
    const { productId, tableNo, phone } = req.params;
  
    try {
      // Remove the item from the cart
      const result = await Cart.deleteOne({ productId, tableNo, phone });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }
      res.json({ message: 'Item removed from cart' });
    } catch (error) {
      console.error('Error removing item from cart:', error);
      res.status(500).json({ error: 'Failed to remove item from cart' });
    }
  });
  

module.exports = router;
