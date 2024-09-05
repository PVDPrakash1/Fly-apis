var express = require("express");
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
var router = express.Router();
var Practice = require("../models/practice");
var County = require("../models/county");
var State = require("../models/state");
var Speciality = require("../models/speciality");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const practices = await Practice.find({}, { _id: 1, name: 1, taxId: 1, npi: 1, pmSystem: 1, drugInventory: 1, state: 1, specialities: 1, status: 1 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("state", "name")
      .populate("specialities", "name");

    const totalCount = await Practice.countDocuments({});
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      data: practices,
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
  "/",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("shortName").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Short name is required");
      }
      const existingPractice = await Practice.findOne({ shortName: value });
      if (existingPractice) {
        throw new Error("Short name must be unique");
      }
      return true;
    }),
    body("taxId").notEmpty().withMessage("Tax ID is required").isNumeric().withMessage("Tax ID must be a number").isLength({ min: 9, max: 9 }).withMessage("Tax ID must be 9 digits long"),
    body("npi").notEmpty().withMessage("NPI is required").isNumeric().withMessage("NPI must be a number").isLength({ min: 10, max: 10 }).withMessage("NPI must be 10 digits long"),
    body("pmSystem").notEmpty().withMessage("PM System is required"),
    body("clearingHouse").notEmpty().withMessage("Clearing House is required"),
    body("state").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("State is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("State ID is invalid");
      }
      const stateExists = await State.findById(value);
      if (!stateExists) {
        throw new Error("State does not exist");
      }
      return true;
    }),
    body("physicalAddress").notEmpty().withMessage("Physical Address is required"),
    body("billingAddress").notEmpty().withMessage("Billing Address is required"),
    body("county").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("County ID is invalid");
      }
      const countyExists = await County.findById(value);
      if (!countyExists) {
        throw new Error("County does not exist");
      }
      return true;
    }),
    body("specialities").custom(async (value, { req }) => {
      if (!Array.isArray(value)) {
        throw new Error("Specialities must be an array");
      }
      if (!value.length) {
        throw new Error("At least one speciality is required");
      }
      const uniqueSpecialities = [...new Set(value)];
      if (uniqueSpecialities.length !== value.length) {
        throw new Error("Specialities cannot contain duplicates");
      }
      for (const specialityId of value) {
        if (!mongoose.Types.ObjectId.isValid(specialityId)) {
          throw new Error(`Speciality ID "${specialityId}" is invalid`);
        }
        const specialityExists = await Speciality.findById(specialityId);
        if (!specialityExists) {
          throw new Error(`Speciality with ID "${specialityId}" does not exist`);
        }
      }
      return true;
    }),
    body("status").notEmpty().withMessage("Status is required").isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, shortName, taxId, npi, pmSystem, clearingHouse, emrName, drugInventory, state, physicalAddress, billingAddress, county, locality, specialities, status } = req.body;
    try {
      const practice = await Practice.create({
        name,
        shortName,
        taxId,
        npi,
        pmSystem,
        clearingHouse,
        emrName,
        drugInventory,
        state: state ? state : null,
        physicalAddress,
        billingAddress,
        county: county ? county : null,
        locality,
        specialities: specialities ? specialities : [],
        status: status,
      });
      res.json({ message: "Create successful", data: { _id: practice._id, name: practice.name } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/:id",
  verifyToken,
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
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;

    try {
      const practice = await Practice.findById(practiceId, {
        _id: 1,
        name: 1,
        shortName: 1,
        taxId: 1,
        npi: 1,
        pmSystem: 1,
        clearingHouse: 1,
        emrName: 1,
        drugInventory: 1,
        state: 1,
        physicalAddress: 1,
        billingAddress: 1,
        county: 1,
        locality: 1,
        specialities: 1,
        status: 1,
      })
        .populate("county", "name")
        .populate("state", "name")
        .populate("specialities", "name");
      if (!practice) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.json({ data: practice });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/:id",
  verifyToken,
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
    body("name").notEmpty().withMessage("Name is required"),
    body("shortName").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Short name is required");
      }
      const existingPractice = await Practice.findOne({ shortName: value, _id: { $ne: req.params.id } });
      if (existingPractice) {
        throw new Error("Short name must be unique");
      }
      return true;
    }),
    body("taxId").notEmpty().withMessage("Tax ID is required").isNumeric().withMessage("Tax ID must be a number").isLength({ min: 9, max: 9 }).withMessage("Tax ID must be 9 digits long"),
    body("npi").notEmpty().withMessage("NPI is required").isNumeric().withMessage("NPI must be a number").isLength({ min: 10, max: 10 }).withMessage("NPI must be 10 digits long"),
    body("pmSystem").notEmpty().withMessage("PM System is required"),
    body("clearingHouse").notEmpty().withMessage("Clearing House is required"),
    body("state").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("State is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("State ID is invalid");
      }
      const stateExists = await State.findById(value);
      if (!stateExists) {
        throw new Error("State does not exist");
      }
      return true;
    }),
    body("physicalAddress").notEmpty().withMessage("Physical Address is required"),
    body("billingAddress").notEmpty().withMessage("Billing Address is required"),
    body("county").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("County ID is invalid");
      }
      const countyExists = await County.findById(value);
      if (!countyExists) {
        throw new Error("County does not exist");
      }
      return true;
    }),
    body("specialities").custom(async (value, { req }) => {
      if (!Array.isArray(value)) {
        throw new Error("Specialities must be an array");
      }
      if (!value.length) {
        throw new Error("At least one speciality is required");
      }
      const uniqueSpecialities = [...new Set(value)];
      if (uniqueSpecialities.length !== value.length) {
        throw new Error("Specialities cannot contain duplicates");
      }
      for (const specialityId of value) {
        if (!mongoose.Types.ObjectId.isValid(specialityId)) {
          throw new Error(`Speciality ID "${specialityId}" is invalid`);
        }
        const specialityExists = await Speciality.findById(specialityId);
        if (!specialityExists) {
          throw new Error(`Speciality with ID "${specialityId}" does not exist`);
        }
      }
      return true;
    }),
    body("status").notEmpty().withMessage("Status is required").isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const { name, shortName, taxId, npi, pmSystem, clearingHouse, emrName, drugInventory, state, physicalAddress, billingAddress, county, locality, specialities, status } = req.body;
    try {
      let practice = await Practice.findById(practiceId);
      if (!practice) {
        return res.status(404).json({ message: "Practice not found." });
      }

      practice.name = name;
      practice.shortName = shortName;
      practice.taxId = taxId;
      practice.npi = npi;
      practice.pmSystem = pmSystem;
      practice.clearingHouse = clearingHouse;
      practice.emrName = emrName;
      practice.drugInventory = drugInventory;
      practice.state = state || null;
      practice.physicalAddress = physicalAddress;
      practice.billingAddress = billingAddress;
      practice.county = county || null;
      practice.locality = locality;
      practice.specialities = specialities || [];
      practice.status = status;

      practice = await practice.save();

      res.json({ message: "Update successful", data: { _id: practice._id, name: practice.name } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
