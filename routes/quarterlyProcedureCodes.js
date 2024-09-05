var express = require("express");
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
var router = express.Router();
var ProcedureCode = require("../models/procedureCode");
var QuarterlyProcedureCode = require("../models/quarterlyProcedureCode");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, async function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!req.query.year || !req.query.quarter) {
      return res.status(400).json({ message: "Please choose Year and Quarter." });
    }

    const quarterlyProcedureCodes = await QuarterlyProcedureCode.find(
      {
        year: req.query.year,
        quarter: req.query.quarter,
      },
      { _id: 1, year: 1, quarter: 1, procedureCode: 1, dosage: 1, paymentLimit: 1, paymentLimitWoSeq: 1, status: 1 }
    )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("procedureCode", ["hcpcsCode", "shortDescription"]);

    const totalCount = await QuarterlyProcedureCode.countDocuments({
      year: req.query.year,
      quarter: req.query.quarter,
    });
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      data: quarterlyProcedureCodes,
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

router.post("/", verifyToken,
  [
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
    body("procedureCode").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Procedure Code is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Procedure Code ID is invalid");
      }
      const procedureCode = await ProcedureCode.findById(value);
      if (!procedureCode) {
        throw new Error("Procedure Code not found");
      }
      const existingQuarterlyProcedureCode = await QuarterlyProcedureCode.findOne({ procedureCode: procedureCode.id, year: req.body.year, quarter: req.body.quarter });
      if (existingQuarterlyProcedureCode) {
        throw new Error(`Procedure Code ${procedureCode.hcpcsCode} is already exists in ${req.body.year} and ${req.body.quarter}`);
      }
      return true;
    }),
    body("paymentLimit").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Payment Limit must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("paymentLimitWoSeq").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Payment Limit W/O Seq must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { year, quarter, procedureCode, dosage, paymentLimit, paymentLimitWoSeq } = req.body;
    try {
      const quarterlyProcedureCode = await QuarterlyProcedureCode.create({
        year,
        quarter,
        procedureCode,
        dosage,
        paymentLimit,
        paymentLimitWoSeq,
        status: "active",
      });
      res.json({
        message: "Create successful",
        data: { _id: quarterlyProcedureCode._id, year: quarterlyProcedureCode.year, quarter: quarterlyProcedureCode.quarter, procedureCode: quarterlyProcedureCode.procedureCode },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

router.get("/:id", verifyToken,
  [
    param("id").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Quarterly Procedure Code is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Quarterly Procedure Code ID is invalid");
      }
      const quarterlyProcedureCode = await QuarterlyProcedureCode.findById(value);
      if (!quarterlyProcedureCode) {
        throw new Error("Quarterly Procedure Code not found");
      }
      return true;
    }),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const quarterlyProcedureCodeId = req.params.id;

    try {
      const quarterlyProcedureCode = await QuarterlyProcedureCode.findById(quarterlyProcedureCodeId, {
        _id: 1,
        year: 1,
        quarter: 1,
        procedureCode: 1,
        dosage: 1,
        paymentLimit: 1,
        paymentLimitWoSeq: 1,
        status: 1,
      }).populate("procedureCode", ["hcpcsCode", "shortDescription"]);
      if (!quarterlyProcedureCode) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.json({ data: quarterlyProcedureCode });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

router.put("/:id", verifyToken,
  [
    param("id").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Quarterly Procedure Code is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Quarterly Procedure Code ID is invalid");
      }
      const quarterlyProcedureCode = await QuarterlyProcedureCode.findById(value);
      if (!quarterlyProcedureCode) {
        throw new Error("Quarterly Procedure Code not found");
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
    body("procedureCode").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Procedure Code is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Procedure Code ID is invalid");
      }
      const procedureCode = await ProcedureCode.findById(value);
      if (!procedureCode) {
        throw new Error("Procedure Code not found");
      }
      const existingQuarterlyProcedureCode = await QuarterlyProcedureCode.findOne({ procedureCode: procedureCode.id, year: req.body.year, quarter: req.body.quarter, _id: { $ne: req.params.id } });
      if (existingQuarterlyProcedureCode) {
        throw new Error(`Procedure Code ${procedureCode.hcpcsCode} is already exists in ${req.body.year} and ${req.body.quarter}`);
      }
      return true;
    }),
    body("paymentLimit").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Payment Limit must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("paymentLimitWoSeq").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Payment Limit W/O Seq must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("status").notEmpty().withMessage("Status is required").isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const quarterlyProcedureCodeId = req.params.id;
    const { year, quarter, procedureCode, dosage, paymentLimit, paymentLimitWoSeq, status } = req.body;
    try {
      let quarterlyProcedureCode = await QuarterlyProcedureCode.findById(quarterlyProcedureCodeId);

      quarterlyProcedureCode.year = year;
      quarterlyProcedureCode.quarter = quarter;
      quarterlyProcedureCode.procedureCode = procedureCode;
      quarterlyProcedureCode.dosage = dosage;
      quarterlyProcedureCode.paymentLimit = paymentLimit;
      quarterlyProcedureCode.paymentLimitWoSeq = paymentLimitWoSeq;
      quarterlyProcedureCode.status = status;

      quarterlyProcedureCode = await quarterlyProcedureCode.save();

      res.json({
        message: "Update successful",
        data: { _id: quarterlyProcedureCode._id, year: quarterlyProcedureCode.year, quarter: quarterlyProcedureCode.quarter, procedureCode: quarterlyProcedureCode.procedureCode },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

module.exports = router;
