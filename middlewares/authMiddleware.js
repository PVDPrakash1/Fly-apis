require("dotenv").config();

var path = require("path");

const dotEnv = require('dotenv');

// Define the path to the .env file
console.log(__dirname)
const configFile = path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`);
const config = dotEnv.config({ path: configFile }).parsed;

const jwt = require("jsonwebtoken");
const jwtSecretKey = config.JWT_SECRET_KEY;
var Token = require("../models/token");

const verifyToken = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authorizationHeader.replace(/^Bearer\s/, "");

  try {
    // Check if the token exists in the database and is revoked
    const tokenData = await Token.findOne({ token }).exec();

    if (tokenData && tokenData.revoked) {
      return res.status(401).json({ message: "Token revoked" });
    }

    // Token is valid, proceed with verification
    jwt.verify(token, jwtSecretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: err.message });
      }
      req.decoded = decoded;
      next();
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { verifyToken };
