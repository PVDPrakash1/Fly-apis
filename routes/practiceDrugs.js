var express = require("express");
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
var router = express.Router();
var Practice = require("../models/practice");
var Drug = require("../models/drug");
var Protocol = require("../models/protocol");
var QuarterlyProcedureCode = require("../models/quarterlyProcedureCode");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/:id/drugs", verifyToken,
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

      if (!req.query.year || !req.query.quarter || !req.query.protocol) {
        return res.status(400).json({ message: "Please choose Year, Quarter and Protocol." });
      }

      const drugs = await Drug.find(
        { practice: practiceId, year: req.query.year, quarter: req.query.quarter, protocol: req.query.protocol },
        {
          _id: 1,
          practice: 1,
          year: 1,
          quarter: 1,
          protocol: 1,
          medicalConditionName: 1,
          quarterlyProcedureCode: 1,
          name: 1,
          payerPreference: 1,
          practicePreference: 1,
          units: 1,
          drugCost: 1,
          asp: 1,
          allowed: 1,
          feeMode: 1,
          estimatedRebate: 1,
          estimatedRebatePercentage: 1,
          buyBillPlWithRebate: 1,
          buyBillPlWithoutRebate: 1,
          status: 1,
        }
      )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("practice", "name")
        .populate("protocol", ["name", "year", "quarter"])
        .populate({
          path: "quarterlyProcedureCode",
          select: ["year", "quarter", "procedureCode"],
          populate: {
            path: "procedureCode",
            select: ["hcpcsCode", "shortDescription"],
          },
        });

      const totalCount = await Drug.countDocuments({ practice: practiceId, year: req.query.year, quarter: req.query.quarter, protocol: req.query.protocol });
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        data: drugs,
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

router.get("/:id/getMedicalCondtionsByProtocols/:protocolId", verifyToken,
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
    param("protocolId").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Protocol Id is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Protocol Id is invalid");
      }
      const protocol = await Protocol.findById(value);
      if (!protocol) {
        throw new Error("Protocol not found");
      }
      // if (protocolExists.year != req.body.year || protocolExists.quarter != req.body.quarter) {
      //   throw new Error(`Protocol ${protocolExists.name} is not exists in ${req.body.year} and ${req.body.quarter}`);
      // }
      return true;
    }),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const protocolId = req.params.protocolId;
    try {
      const drugsInfo = await Drug.find({ practice: practiceId, protocol:protocolId });

      const medicalConditions = [];
      drugsInfo.map((drug) => {
        medicalConditions.push(drug.medicalConditionName);
      })
      res.json({ data: medicalConditions });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

router.get("/:id/getDrugsByMedicalConditions/:medicalCondition", verifyToken,
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
    param("medicalCondition").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Medical Condition is required");
      }
      
      const medicalCondition = await Drug.find({medicalConditionName: value});
      if (!medicalCondition) {
        throw new Error("medicalCondition not found");
      }
      // if (protocolExists.year != req.body.year || protocolExists.quarter != req.body.quarter) {
      //   throw new Error(`Protocol ${protocolExists.name} is not exists in ${req.body.year} and ${req.body.quarter}`);
      // }
      return true;
    }),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const medicalCondition = req.params.medicalCondition;
    try {
      const drugsInfo = await Drug.find({ practice: practiceId, medicalConditionName:medicalCondition }).populate("practice", "name")
      .populate("protocol", ["name", "year", "quarter"])
      .populate({
        path: "quarterlyProcedureCode",
        select: ["year", "quarter", "procedureCode"],
        populate: {
          path: "procedureCode",
          select: ["hcpcsCode", "shortDescription"],
        },
      });

     
      res.json({ data: drugsInfo });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

router.post("/:id/drugs", verifyToken,
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
      const existingDrug = await Drug.findOne({ practice: req.params.id, name: value, year: req.body.year, quarter: req.body.quarter });
      if (existingDrug) {
        throw new Error(`Drug ${value} already exists in ${req.body.year} and ${req.body.quarter}`);
      }
      return true;
    }),
    body("protocol").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Protocol is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Protocol ID is invalid");
      }
      const protocolExists = await Protocol.findOne({ practice: req.params.id, _id: value });
      if (!protocolExists) {
        throw new Error("Protocol does not exist");
      }
      if (protocolExists.year != req.body.year || protocolExists.quarter != req.body.quarter) {
        throw new Error(`Protocol ${protocolExists.name} is not exists in ${req.body.year} and ${req.body.quarter}`);
      }
      return true;
    }),
    body("medicalConditionName").notEmpty().withMessage("Medical Condition Name is required"),
    body("quarterlyProcedureCode").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Drug Code is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Drug Code ID is invalid");
      }
      const drugCodeExists = await QuarterlyProcedureCode.findById(value);
      if (!drugCodeExists) {
        throw new Error("Drug Code does not exist");
      }
      if (drugCodeExists.year != req.body.year || drugCodeExists.quarter != req.body.quarter) {
        throw new Error(`Drug Code ${drugCodeExists.name} is not exists in ${req.body.year} and ${req.body.quarter}`);
      }
      return true;
    }),
    body("units").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (isNaN(value)) {
        throw new Error("Units must be a number");
      }
      return true;
    }),
    body("drugCost").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Drug Cost must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("asp").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("ASP+4.3% must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("allowed").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Allowed must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("estimatedRebate").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Estimated Rebate must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("estimatedRebatePercentage").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const percentage = /^(100(\.00?)?|(\d{1,2}(\.\d{1,2})?))$/; // Regex for percentage format from 0 to 100 with up to 2 decimal places
      if (!percentage.test(value)) {
        throw new Error("Estimated Rebate Percentage must be a valid percentage (e.g., 0, 99.99, 100)");
      }
      return true;
    }),
    body("buyBillPlWithRebate").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Buy & Bill P/L With Rebate must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("buyBillPlWithoutRebate").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Buy & Bill P/L Without Rebate must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const {
      year,
      quarter,
      protocol,
      medicalConditionName,
      quarterlyProcedureCode,
      name,
      payerPreference,
      practicePreference,
      units,
      drugCost,
      asp,
      allowed,
      feeMode,
      estimatedRebate,
      estimatedRebatePercentage,
      buyBillPlWithRebate,
      buyBillPlWithoutRebate,
    } = req.body;
    try {
      const existingDrug = await Drug.findOne({ practice: practiceId, name, year, quarter });

      if (existingDrug) {
        return res.status(400).json({ message: "Drug already exists." });
      }

      const drug = await Drug.create({
        practice: practiceId,
        year,
        quarter,
        protocol,
        medicalConditionName,
        quarterlyProcedureCode,
        name,
        payerPreference,
        practicePreference,
        units,
        drugCost,
        asp,
        allowed,
        feeMode,
        estimatedRebate,
        estimatedRebatePercentage,
        buyBillPlWithRebate,
        buyBillPlWithoutRebate,
        status: "active",
      });
      res.json({ message: "Create successful", data: { _id: drug._id, name: drug.name, year: drug.year, quarter: drug.quarter } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

router.get("/:id/drugs/:did", verifyToken,
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
    param("did").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Drug ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Drug ID is invalid");
      }
      const drug = await Drug.findById(value);
      if (!drug) {
        throw new Error("Drug not found");
      }
      if (drug.practice.toString() !== req.params.id) {
        throw new Error("Drug does not belong to the specified Practice");
      }
      return true;
    }),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const drugId = req.params.did;

    try {
      const drug = await Drug.findById(drugId, {
        _id: 1,
        practice: 1,
        year: 1,
        quarter: 1,
        protocol: 1,
        medicalConditionName: 1,
        quarterlyProcedureCode: 1,
        name: 1,
        payerPreference: 1,
        practicePreference: 1,
        units: 1,
        drugCost: 1,
        asp: 1,
        allowed: 1,
        feeMode: 1,
        estimatedRebate: 1,
        estimatedRebatePercentage: 1,
        buyBillPlWithRebate: 1,
        buyBillPlWithoutRebate: 1,
        status: 1,
      })
        .populate("practice", "name")
        .populate("protocol", ["name", "year", "quarter"])
        .populate({
          path: "quarterlyProcedureCode",
          select: ["year", "quarter", "procedureCode"],
          populate: {
            path: "procedureCode",
            select: ["hcpcsCode", "shortDescription"],
          },
        });
      if (!drug) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.json({ data: drug });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

router.put("/:id/drugs/:did", verifyToken,
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
    param("did").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Drug ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Drug ID is invalid");
      }
      const drug = await Drug.findById(value);
      if (!drug) {
        throw new Error("Drug not found");
      }
      if (drug.practice.toString() !== req.params.id) {
        throw new Error("Drug does not belong to the specified Practice");
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
      const existingDrug = await Drug.findOne({ practice: req.params.id, name: value, year: req.body.year, quarter: req.body.quarter, _id: { $ne: req.params.id } });
      if (existingDrug) {
        throw new Error(`Drug ${value} already exists in ${req.body.year} and ${req.body.quarter}`);
      }
      return true;
    }),
    body("protocol").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Protocol is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Protocol ID is invalid");
      }
      const protocolExists = await Protocol.findOne({ practice: req.params.id, _id: value });
      if (!protocolExists) {
        throw new Error("Protocol does not exist");
      }
      if (protocolExists.year != req.body.year || protocolExists.quarter != req.body.quarter) {
        throw new Error(`Protocol ${protocolExists.name} is not exists in ${req.body.year} and ${req.body.quarter}`);
      }
      return true;
    }),
    body("medicalConditionName").notEmpty().withMessage("Medical Condition Name is required"),
    body("quarterlyProcedureCode").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Drug Code is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Drug Code ID is invalid");
      }
      const drugCodeExists = await QuarterlyProcedureCode.findById(value);
      if (!drugCodeExists) {
        throw new Error("Drug Code does not exist");
      }
      if (drugCodeExists.year != req.body.year || drugCodeExists.quarter != req.body.quarter) {
        throw new Error(`Drug Code ${drugCodeExists.name} is not exists in ${req.body.year} and ${req.body.quarter}`);
      }
      return true;
    }),
    body("units").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (isNaN(value)) {
        throw new Error("Units must be a number");
      }
      return true;
    }),
    body("drugCost").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Drug Cost must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("asp").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("ASP+4.3% must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("allowed").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Allowed must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("estimatedRebate").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Estimated Rebate must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("estimatedRebatePercentage").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const percentage = /^(100(\.00?)?|(\d{1,2}(\.\d{1,2})?))$/; // Regex for percentage format from 0 to 100 with up to 2 decimal places
      if (!percentage.test(value)) {
        throw new Error("Estimated Rebate Percentage must be a valid percentage (e.g., 0, 99.99, 100)");
      }
      return true;
    }),
    body("buyBillPlWithRebate").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Buy & Bill P/L With Rebate must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
      }
      return true;
    }),
    body("buyBillPlWithoutRebate").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      const usPriceFormat = /^\d+(\.\d{1,3})?$/; // Regex for US price format without a dollar sign and up to 3 decimal places
      if (!usPriceFormat.test(value)) {
        throw new Error("Buy & Bill P/L Without Rebate must be in a valid format (e.g., 123, 123.4, 123.45, 123.456)");
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
    const drugId = req.params.did;
    const {
      year,
      quarter,
      protocol,
      medicalConditionName,
      quarterlyProcedureCode,
      name,
      payerPreference,
      practicePreference,
      units,
      drugCost,
      asp,
      allowed,
      feeMode,
      estimatedRebate,
      estimatedRebatePercentage,
      buyBillPlWithRebate,
      buyBillPlWithoutRebate,
      status,
    } = req.body;
    try {
      let drug = await Drug.findById(drugId);

      drug.year = year;
      drug.quarter = quarter;
      drug.protocol = protocol;
      drug.medicalConditionName = medicalConditionName;
      drug.quarterlyProcedureCode = quarterlyProcedureCode;
      drug.name = name;
      drug.payerPreference = payerPreference;
      drug.practicePreference = practicePreference;
      drug.units = units;
      drug.drugCost = drugCost;
      drug.asp = asp;
      drug.allowed = allowed;
      drug.feeMode = feeMode;
      drug.estimatedRebate = estimatedRebate;
      drug.estimatedRebatePercentage = estimatedRebatePercentage;
      drug.buyBillPlWithRebate = buyBillPlWithRebate;
      drug.buyBillPlWithoutRebate = buyBillPlWithoutRebate;
      drug.status = status;

      drug = await drug.save();

      res.json({ message: "Update successful", data: { _id: drug._id, name: drug.name, year: drug.year, quarter: drug.quarter } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

module.exports = router;
