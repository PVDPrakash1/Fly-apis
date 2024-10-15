var express = require("express");
const { body, validationResult } = require("express-validator");
var router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
var User = require("../models/user");
var Token = require("../models/token");

require("dotenv").config();

var path = require("path");

const dotEnv = require('dotenv');

// Define the path to the .env file
console.log(__dirname)
const configFile = path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`);
const config = dotEnv.config({ path: configFile }).parsed;

const jwtSecretKey = config.JWT_SECRET_KEY;
const { verifyToken } = require("../middlewares/authMiddleware");

router.post('/register', async (req, res) => {
  const { username, password, name } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
  }

  // Hash the password and save the user
  const hashedPassword = bcrypt.hashSync(password, 8);
  const newUser = new User({ username, password: hashedPassword, name });

  try {
      await newUser.save();
      res.json({ message: 'User registered successfully' });
  } catch (error) {
      res.status(500).json({ message: 'Error registering user', error });
  }
});

router.post(
  "/login",
  async  (req, res) => {
    const { username, password } = req.body;

    try {
      console.log(username, password);
      const user = await User.findOne({ username });
      console.log(user);
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: "Invalid Username or password" });
      }

      const token = jwt.sign({ username: username }, jwtSecretKey, { expiresIn: "1h" });

      await Token.create({ user: user._id, token, expiresAt: Date.now() + 3600000 });

      res.json({ message: "Login successful", data: { token: token, name: user.name, username: user.username } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/verify", verifyToken, (req, res) => {
  res.json({ message: "Verified successfully" });
});

router.get("/logout", async (req, res) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authorizationHeader.replace(/^Bearer\s/, "");

  try {
    await Token.findOneAndUpdate({ token }, { revoked: true, revokedAt: Date.now() });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
