var express = require("express");
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
var router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const Product = require("../models/Product");
const Category = require("../models/Category");

// Set storage engine for multer
const storage = multer.diskStorage({
  destination: './uploads/', // Folder to save the uploaded files
  filename: (req, file, cb) => {
    // Generate a unique filename with the original extension
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

// Initialize upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 3000000 }, // Limit file size to 1MB
  fileFilter: (req, file, cb) => {
    // Only allow image files (e.g., png, jpg, jpeg)
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpg, jpeg, png) are allowed!'));
    }
  },
});

router.get('/getByCategory/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  try {
    const products = await Product.find({ category:categoryId });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get("/all", async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.aggregate([
      {
        $lookup: {
          from: 'foodtypes',          // The other collection name
          localField: '_id',        // Field from the 'users' collection
          foreignField: 'foodType',   // Field from the 'orders' collection
          as: 'foodtypeDetails',         // Resulting array field to store matched data
        },
        // $lookup: {
        //     from: 'categoris',          // The other collection name
        //     localField: '_id',        // Field from the 'users' collection
        //     foreignField: 'category',   // Field from the 'orders' collection
        //     as: 'categoryDetails',         // Resulting array field to store matched data
        //   },
      }
    ]).sort({ createdAt: -1 })
      // .skip(skip)
      // .limit(limit)

    const totalCount = await Product.countDocuments({});
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      data: products,
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
  upload.single('image'),
  [
    body("name").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Name is required");
      }
      const existingProducts = await Product.findOne({ name: value });
      if (existingProducts) {
        throw new Error("Name must be unique");
      }
      return true;
    }),
    body("foodType").notEmpty().withMessage("Food Type is required"),
    body("category").notEmpty().withMessage("Category is required"),
    body("position").notEmpty().withMessage("Position is required"),
    body("price").notEmpty().withMessage("Price is required"),
    body("status").notEmpty().withMessage("Status is required").isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, position, price, status, category, categoryName, foodType, foodTypeName} = req.body;
    try {

      // File path for the original image
      const imagePath = `/uploads/products/${req.file.filename}`;
    
      // Generate a thumbnail using Sharp
      const thumbnailFilename = `thumbnail-${req.file.filename}`;
      const thumbnailPath = `/uploads/products/thumbs/${thumbnailFilename}`;

      // Create a thumbnail (e.g., 200x200 pixels)
      await sharp(req.file.path)
        .resize(100, 100)
        .toFile(`./uploads/products/thumbs/${thumbnailFilename}`);

      const product = await Product.create({
        name,
        position,
        price,
        type,
        foodType,
        foodTypeName,
        category,
        categoryName,
        image: req.file ? imagePath : null,
        thumbnail: thumbnailPath,
        status: status,
      });
      res.json({ message: "Create successful", data: { _id: product._id, name: product.name } });
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
    body("status").notEmpty().withMessage("Status is required").isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoriesId = req.params.id;
    const { name, order, status , image} = req.body;

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

      res.json({ message: "Update successful"});
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete("/delete/:tid",
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
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoriesId = req.params.id;
    const categoriesIds = req.params.tid;
    
    try {
      let foodType = await Category.deleteOne({_id:categoriesIds});
        

      res.json({ message: "deleted successful" });
    } catch (error) {
        console.log(error);
      res.status(500).json({ message: error.message });
    }
});

module.exports = router;
