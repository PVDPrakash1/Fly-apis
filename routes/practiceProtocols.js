var express = require("express");
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
var router = express.Router();
var Practice = require("../models/practice");
var Protocol = require("../models/protocol");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/:id/protocols", verifyToken,
  [
    param("id").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Practice ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Practice ID is invalid");
      }
      const practice = await Practice.findById(value);
      if (!practice) {
        throw new Error("Practice not found");
      }
      return true;
    }),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      if (!req.query.year || !req.query.quarter) {
        return res.status(400).json({ message: "Please choose Year and Quarter." });
      }

      const protocols = await Protocol.find({ practice: practiceId, year: req.query.year, quarter: req.query.quarter }, { _id: 1, practice: 1, name: 1, year: 1, quarter: 1, status: 1 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("practice", "name");

      const totalCount = await Protocol.countDocuments({ practice: practiceId, year: req.query.year, quarter: req.query.quarter });
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        data: protocols,
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

router.post("/:id/protocols", verifyToken,
  [
    param("id").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Practice ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Practice ID is invalid");
      }
      const practice = await Practice.findById(value);
      if (!practice) {
        throw new Error("Practice not found");
      }
      return true;
    }),
    body("year").custom(value => {
      if (!value) {
        throw new Error("Year is required");
      }
      if ((!/^\d{4}$/.test(value))) {
        throw new Error("Invalid Year");
      }
      return true;
    }),
    body("quarter").custom(value => {
      if (!value) {
        throw new Error("Quarter is required");
      }
      if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(value)) {
        throw new Error("Quarter must be 'Q1', 'Q2', 'Q3', or 'Q4'");
      }
      return true;
    }),
    body("name").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Name is required");
      }
      const existingProtocol = await Protocol.findOne({ practice: req.params.id, name: value, year: req.body.year, quarter: req.body.quarter });
      if (existingProtocol) {
        throw new Error(`Protocol ${value} already exists in ${req.body.year} and ${req.body.quarter}`);
      }
      return true;
    }),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const { name, year, quarter } = req.body;
    try {
      const protocol = await Protocol.create({
        practice: practiceId,
        name,
        year,
        quarter,
        status: "active",
      });
      res.json({ message: "Create successful", data: { _id: protocol._id, name: protocol.name } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

router.get("/:id/protocols/:pid", verifyToken,
  [
    param("id").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Practice ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Practice ID is invalid");
      }
      const practice = await Practice.findById(value);
      if (!practice) {
        throw new Error("Practice not found");
      }
      return true;
    }),
    param("pid").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Protocol ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Protocol ID is invalid");
      }
      const protocol = await Protocol.findById(value);
      if (!protocol) {
        throw new Error("Protocol not found");
      }
      if (protocol.practice.toString() !== req.params.id) {
        throw new Error("Protocol does not belong to the specified Practice");
      }
      return true;
    }),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const protocolId = req.params.pid;

    try {
      const protocol = await Protocol.findById(protocolId, {
        _id: 1,
        practice: 1,
        name: 1,
        year: 1,
        quarter: 1,
        status: 1,
      }).populate("practice", "name");
      if (!protocol) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.json({ data: protocol });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

router.put("/:id/protocols/:pid", verifyToken,
  [
    param("id").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Practice ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Practice ID is invalid");
      }
      const practice = await Practice.findById(value);
      if (!practice) {
        throw new Error("Practice not found");
      }
      return true;
    }),
    param("pid").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Protocol ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Protocol ID is invalid");
      }
      const protocol = await Protocol.findById(value);
      if (!protocol) {
        throw new Error("Protocol not found");
      }
      if (protocol.practice.toString() !== req.params.id) {
        throw new Error("Protocol does not belong to the specified Practice");
      }
      return true;
    }),
    body("year").custom(value => {
      if (!value) {
        throw new Error("Year is required");
      }
      if ((!/^\d{4}$/.test(value))) {
        throw new Error("Invalid Year");
      }
      return true;
    }),
    body("quarter").custom(value => {
      if (!value) {
        throw new Error("Quarter is required");
      }
      if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(value)) {
        throw new Error("Quarter must be 'Q1', 'Q2', 'Q3', or 'Q4'");
      }
      return true;
    }),
    body("name").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Name is required");
      }
      const existingProtocol = await Protocol.findOne({ practice: req.params.id, name: value, year: req.body.year, quarter: req.body.quarter, _id: { $ne: req.params.id } });
      if (existingProtocol) {
        throw new Error(`Protocol ${value} already exists in ${req.body.year} and ${req.body.quarter}`);
      }
      return true;
    }),
    body("status").notEmpty().withMessage("Status is required").isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const protocolId = req.params.pid;
    const { name, year, quarter, status } = req.body;
    try {
      let protocol = await Protocol.findById(protocolId);

      protocol.name = name;
      protocol.year = year;
      protocol.quarter = quarter;
      protocol.status = status;

      protocol = await protocol.save();

      res.json({ message: "Update successful", data: { _id: protocol._id, name: protocol.name } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

module.exports = router;
