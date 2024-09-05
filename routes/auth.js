var express = require("express");
const { body, validationResult } = require("express-validator");
var router = express.Router();
const jwt = require("jsonwebtoken");
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

router.post(
  "/login",
  [
    body("email").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Email is required");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error("Email must be a valid email address");
      }
      return true;
    }),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign({ email: email }, jwtSecretKey, { expiresIn: "1h" });

      await Token.create({ user: user._id, token, expiresAt: Date.now() + 3600000 });

      res.json({ message: "Login successful", data: { token: token, name: user.name, email: user.email } });
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
