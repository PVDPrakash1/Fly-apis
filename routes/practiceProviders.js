var express = require("express");
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
var router = express.Router();
var Practice = require("../models/practice");
var Provider = require("../models/provider");
var Speciality = require("../models/speciality");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get(
  "/:id/providers",
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
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const providers = await Provider.find({ practice: practiceId }, { _id: 1, practice: 1, firstName: 1, lastName: 1, npi: 1, specialities: 1, providerType: 1, status: 1 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("practice", "name")
        .populate("specialities", "name");

      const totalCount = await Provider.countDocuments({ practice: practiceId });
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        data: providers,
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
  }
);

router.post(
  "/:id/providers",
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
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("npi").notEmpty().withMessage("NPI is required").isNumeric().withMessage("NPI must be a number").isLength({ min: 10, max: 10 }).withMessage("NPI must be 10 digits long"),
    body("fromDate").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("From date must be a valid date");
      }
      return true;
    }),
    body("toDate").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("To date must be a valid date");
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
    body("providerType").notEmpty().withMessage("Provider type is required").isIn(["Doctor", "ARNP"]).withMessage("Invalid Provider type"),
    body("status").notEmpty().withMessage("Status is required").isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const { firstName, middleName, lastName, npi, fromDate, toDate, specialities, providerType, status } = req.body;
    try {
      const provider = await Provider.create({
        practice: practiceId,
        firstName,
        middleName,
        lastName,
        npi,
        fromDate,
        toDate,
        specialities: specialities ? specialities : [],
        providerType,
        status: status,
      });
      res.json({ message: "Create successful", data: { _id: provider._id, firstName: provider.firstName, lastName: provider.lastName } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/:id/providers/:pid",
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
    param("pid").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Provider ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Provider ID is invalid");
      }
      const provider = await Provider.findById(value);
      if (!provider) {
        throw new Error("Provider not found");
      }
      if (provider.practice.toString() !== req.params.id) {
        throw new Error("Provider does not belong to the specified Practice");
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
    const providerId = req.params.pid;

    try {
      const provider = await Provider.findById(providerId, {
        _id: 1,
        practice: 1,
        firstName: 1,
        middleName: 1,
        lastName: 1,
        npi: 1,
        fromDate: 1,
        toDate: 1,
        specialities: 1,
        providerType: 1,
        status: 1,
      })
        .populate("practice", "name")
        .populate("specialities", "name");
      if (!provider) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.json({ data: provider });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/:id/providers/:pid",
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
    param("pid").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Provider ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Provider ID is invalid");
      }
      const provider = await Provider.findById(value);
      if (!provider) {
        throw new Error("Provider not found");
      }
      if (provider.practice.toString() !== req.params.id) {
        throw new Error("Provider does not belong to the specified Practice");
      }
      return true;
    }),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("npi").notEmpty().withMessage("NPI is required").isNumeric().withMessage("NPI must be a number").isLength({ min: 10, max: 10 }).withMessage("NPI must be 10 digits long"),
    body("fromDate").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("From date must be a valid date");
      }
      return true;
    }),
    body("toDate").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("To date must be a valid date");
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
    body("providerType").notEmpty().withMessage("Provider type is required").isIn(["Doctor", "ARNP"]).withMessage("Invalid Provider type"),
    body("status").notEmpty().withMessage("Status is required").isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const providerId = req.params.pid;
    const { firstName, middleName, lastName, npi, fromDate, toDate, specialities, providerType, status } = req.body;
    try {
      let provider = await Provider.findById(providerId);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found." });
      }

      provider.firstName = firstName;
      provider.middleName = middleName;
      provider.lastName = lastName;
      provider.npi = npi;
      provider.fromDate = fromDate;
      provider.toDate = toDate;
      provider.specialities = specialities || [];
      provider.providerType = providerType;
      provider.status = status;

      provider = await provider.save();

      res.json({ message: "Update successful", data: { _id: provider._id, firstName: provider.firstName, lastName: provider.lastName } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
