var express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
var router = express.Router();
const Bar = require("../models/bar");

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



// Set storage engine for multer
const storage = multer.diskStorage({
  destination: "./uploads/", // Folder to save the uploaded files
  filename: (req, file, cb) => {
    // Generate a unique filename with the original extension
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Initialize upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 3000000 }, // Limit file size to 1MB
  fileFilter: (req, file, cb) => {
    // Only allow image files (e.g., png, jpg, jpeg)
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images (jpg, jpeg, png) are allowed!"));
    }
  },
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log(username, password);
    const user = await Bar.findOne({ username });
    console.log(user);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.json({ message: "Invalid Username or password" });
    }

    const token = jwt.sign({ username: username }, jwtSecretKey, {
      expiresIn: "1h",
    });

    await Token.create({
      user: user._id,
      token,
      expiresAt: Date.now() + 3600000,
    });

    res.json({
      message: "Login successful",
      data: { token: token, id:user._id, name: user.name, username: user.username },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/all", async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const waiters = await Bar.aggregate()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Bar.countDocuments({});
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      data: waiters,
      meta: {
        totalRecords: totalCount,
        totalPages: totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/add",
  upload.single("image"),
  [
    body("name").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Name is required");
      }
      const existingCategories = await Bar.findOne({ name: value });
      if (existingCategories) {
        throw new Error("Name must be unique");
      }
      return true;
    }),
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["active", "inactive"])
      .withMessage("Status must be 'active' or 'inactive'"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, username, password, status } = req.body;
    try {
      if (req.file && req.file.fieldname) {
        // File path for the original image
        const imagePath = `/uploads/waiters/${req.file.filename}`;

        // Generate a thumbnail using Sharp
        const thumbnailFilename = `thumbnail-${req.file.filename}`;
        const thumbnailPath = `/uploads/waiters/thumbs/${thumbnailFilename}`;
      
          // Create a thumbnail (e.g., 200x200 pixels)
          await sharp(req.file.path)
            .resize(100, 100)
            .toFile(`./uploads/waiters/thumbs/${thumbnailFilename}`);
      }

      const hashedPassword = bcrypt.hashSync(password, 8);
      const bar = await Bar.create({
        name,
        username: username,
        password: hashedPassword,
        status: status,
      });
      res.json({
        message: "Create successful",
        data: { _id: bar._id, name: bar.name },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/edit/:id",
  [
    param("id").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("id ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("id ID is invalid");
      }
      const foodType = await Category.findById(value);
      if (!foodType) {
        throw new Error("id not found");
      }
      return true;
    }),
    body("name").notEmpty().withMessage("Name is required"),
    body("order").notEmpty().withMessage("Order is required"),
    body("image").notEmpty().withMessage("Image is required"),
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["active", "inactive"])
      .withMessage("Status must be 'active' or 'inactive'"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoriesId = req.params.id;
    const { name, order, status, image } = req.body;

    try {
      let category = await Category.findById(categoriesId);
      if (!category) {
        return res.status(404).json({ message: "foodtype not found." });
      }

      category.name = name;

      category.status = status;
      category.order = order;
      category.image = image;

      category = await category.save();

      res.json({ message: "Update successful" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete(
  "/delete/:tid",
  [
    param("tid").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Transction ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Transction ID is invalid");
      }
      const category = await Category.findById(value);
      if (!category) {
        throw new Error("Transction not found");
      }
      return true;
    }),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoriesId = req.params.id;
    const categoriesIds = req.params.tid;

    try {
      let foodType = await Category.deleteOne({ _id: categoriesIds });

      res.json({ message: "deleted successful" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
