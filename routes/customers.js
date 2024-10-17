var express = require("express");
var router = express.Router();
var Customer = require("../models/customer");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get('/live', async (req, res) => {
    const { table } = req.query;
    const customer = await Customer.find({ table });
  
    res.json({
      users: customer.map(s => ({ name: s.name, phone: s.phone })),
    });
  });

router.post(
    "/add",
    async  (req, res) => {
      try {
        const { name, phone, table } = req.body;

        // Check if customer exists for the table
        let customer = await Customer.findOne({ table });
        
        if (customer) {
          // Update existing customer
          customer.name = name;
          customer.phone = phone;
        } else {
          // Create a new customer
          customer = new Customer({ name, phone, table });
        }
      
        await customer.save();
        res.status(200).send('Customer saved');
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
);

router.post('/join-table', async (req, res) => {
    const { name, phone, table } = req.body;

    try {
        // Check if the user already exists in the table
        const existingUser = await Customer.findOne({ phone, table });

        if (existingUser) {
            return res.status(400).json({ message: 'User already joined this table.' });
        }

        // Create a new user entry
        const newUser = new Customer({ name, phone, table });
        await newUser.save();

        res.status(201).json({ message: 'User joined the table successfully.' });
    } catch (error) {
        console.error('Error joining table:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


module.exports = router;
