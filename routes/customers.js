var express = require("express");
var router = express.Router();
var Customer = require("../models/customer");
var Session = require("../models/session");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get('/live', async (req, res) => {
    const {  table } = req.query;
    const sessions = await Session.find({ table });
  
    if(sessions && sessions.length > 0){
      res.json({
        users: sessions.map(s => ({ name: s.name, phone: s.phone })),
      });
    }else{
      res.json({
        users: [],
      });
    }
  });

router.post(
    "/add",
    async  (req, res) => {
      try {
        const { name, phone } = req.body;

        // Check if customer exists for the table
        let customer = await Customer.findOne({ phone });
        
        if (customer) {
          // Update existing customer
          customer.name = name;
          customer.phone = phone;
        } else {
          // Create a new customer
          customer = new Customer({ name, phone });
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
      console.log(phone);
        // Check if the user already exists in the table
        const existingUser = await Customer.findOne(
          { phone: phone });

        console.log(existingUser);

        if (existingUser === null) {
          console.log("comets here");
          // Create a new user entry
          const newUser = new Customer({ name, phone });
          await newUser.save();
        }

        const existingSession = await Session.findOne({ phone, table });
        console.log(existingSession);
        if (existingSession === null) {
          console.log("cometss here");
          const newSession = new Session({ name, phone, table });
          await newSession.save();
        }

      
        res.status(201).json({ message: 'Joined the table successfully.' });
    } catch (error) {
        console.error('Error joining table:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


module.exports = router;
