var express = require("express");
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
var router = express.Router();
var Practice = require("../models/practice");
var Protocol = require("../models/protocol");
var Payer = require("../models/payer");
var ProtocolPayer = require("../models/protocolPayer");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/:id/protocol-mappings", verifyToken,
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

      const protocols = await Protocol.find({ practice: practiceId, year: req.query.year, quarter: req.query.quarter, status: "active" }, { _id: 1, practice: 1, name: 1, year: 1, quarter: 1 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("practice", "name");

      const totalCount = await Protocol.countDocuments({ practice: practiceId, year: req.query.year, quarter: req.query.quarter });
      const totalPages = Math.ceil(totalCount / limit);

      const plainProtocols = protocols.map((protocol) => protocol.toObject());

      for (let protocol of plainProtocols) {
        const protocolPayers = await ProtocolPayer.find({ practice: practiceId, protocol: protocol._id }, { payer: 1 }).populate("payer", "name");
        protocol.payers = protocolPayers;
      }

      res.json({
        data: plainProtocols,
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

router.put("/:id/protocol-mappings/:pid", verifyToken,
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
    body("payerIds").custom(async (value, { req }) => {
      if (!Array.isArray(value)) {
        throw new Error("Payers must be an array");
      }
      if (!value.length) {
        throw new Error("At least one Payer is required");
      }
      const uniquePayers = [...new Set(value)];
      if (uniquePayers.length !== value.length) {
        throw new Error("Payers cannot contain duplicates");
      }
      for (const payerId of value) {
        if (!mongoose.Types.ObjectId.isValid(payerId)) {
          throw new Error(`Payer ID "${payerId}" is invalid`);
        }
        const payerExists = await Payer.findById(payerId);
        if (!payerExists) {
          throw new Error(`Payer with ID "${payerId}" does not exist`);
        }
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
    const { payerIds } = req.body;
    try {
      let protocol = await Protocol.findById(protocolId);
      if (!protocol) {
        return res.status(404).json({ message: "Protocol not found." });
      }

      const uniquePayerIds = [...new Set(payerIds)];

      if (payerIds.length !== uniquePayerIds.length) {
        return res.status(400).json({ message: "payerIds must be unique." });
      }

      await ProtocolPayer.deleteMany({ practice: practiceId, protocol: protocolId });

      for (const payerId of payerIds) {
        await ProtocolPayer.create({ practice: practiceId, protocol: protocolId, payer: payerId });
      }

      res.json({ message: "Update successful", data: { _id: protocol._id, name: protocol.name } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

module.exports = router;
