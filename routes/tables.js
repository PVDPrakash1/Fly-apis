const express = require("express");
const router = express.Router();
const Table = require("../models/table"); // Assuming you have a Cart model
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { verifyToken } = require("../middlewares/authMiddleware");


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

  router.get('/all', async (req, res) => {
    const tables = await Table.find({  });
    res.json({tables: tables});
  });
  
// Fetch available tables
router.get('/available', async (req, res) => {
  const availableTables = await Table.find({ isAssigned: false });
  res.json({availableTables: availableTables});
});

// Fetch assigned tables for a waiter
router.get('/assigned/:waiterId', async (req, res) => {
  const waiterId = req.params.waiterId;
  const assignedTables = await Table.find({ assignedWaiter: waiterId });
  res.json({assignedTables: assignedTables});
});

// Assign tables to waiter
router.post('/assign', async (req, res) => {
  try {
    const { assignedTables, unassignedTables, waiterId } = req.body;

    // Assign the tables
    if (assignedTables && assignedTables.length > 0) {
      await Table.updateMany(
        { _id: { $in: assignedTables } },
        { $set: { assignedWaiter: waiterId, isAssigned: true } }
      );
    }

    // Unassign the tables
    if (unassignedTables && unassignedTables.length > 0) {
      await Table.updateMany(
        { _id: { $in: unassignedTables } },
        { $set: { assignedWaiter: null, isAssigned: false } }
      );
    }

    return res.status(200).json({ message: 'Tables updated successfully' });
  } catch (error) {
    console.error('Error updating tables:', error);
    return res.status(500).json({ message: 'Error updating tables' });
  }
});

  router.post(
    "/add",
    upload.single('image'),
    [
      body("tableNo").custom(async (value, { req }) => {
        if (!value) {
          throw new Error("TableNo is required");
        }
        const existingCategories = await Table.findOne({ name: value });
        if (existingCategories) {
          throw new Error("TableNo must be unique");
        }
        return true;
      }),
      body("qrCodeUrl").notEmpty().withMessage("qrCodeUrl is required"),
      body("status").notEmpty().withMessage("Status is required").isIn(['available', 'occupied', 'cleaning', 'reserved']).withMessage("Status must be 'active' or 'inactive'"),
    ],
    async function (req, res, next) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { tableNo, qrCodeUrl, capacity, status} = req.body;
      try {
  
        // File path for the original image
        const imagePath = `/uploads/qrCodes/${req.file.filename}`;
      
        // Generate a thumbnail using Sharp
        const thumbnailFilename = `thumbnail-${req.file.filename}`;
        const thumbnailPath = `/uploads/qrCodes/thumbs/${thumbnailFilename}`;
  
        // Create a thumbnail (e.g., 200x200 pixels)
        await sharp(req.file.path)
          .resize(100, 100)
          .toFile(`./uploads/qrCodes/thumbs/${thumbnailFilename}`);
  
        const table = await Table.create({
          tableNo,
          qrCodeUrl,
          assignedTo:null,
          qrCodeImage: req.file ? imagePath : null,
          qrCodeThumbnail: thumbnailPath,
          status: status,
          capacity: capacity,
        });
        res.json({ message: "Create successful", data: { _id: table._id, name: table.tableNo } });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
  
  module.exports = router;