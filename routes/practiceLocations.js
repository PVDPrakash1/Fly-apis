var express = require("express");
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
var router = express.Router();
var Practice = require("../models/practice");
var Location = require("../models/location");
var State = require("../models/state");
var Speciality = require("../models/speciality");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get(
  "/:id/locations",
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

      const locations = await Location.find({ practice: practiceId }, { _id: 1, practice: 1, name: 1, taxId: 1, npi: 1, specialities: 1, physicalAddress: 1, status: 1 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("practice", "name")
        .populate("specialities", "name");

      const totalCount = await Location.countDocuments({ practice: practiceId });
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        data: locations,
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
  "/:id/locations",
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
    body("taxId").notEmpty().withMessage("Tax ID is required").isNumeric().withMessage("Tax ID must be a number").isLength({ min: 9, max: 9 }).withMessage("Tax ID must be 9 digits long"),
    body("npi").notEmpty().withMessage("NPI is required").isNumeric().withMessage("NPI must be a number").isLength({ min: 10, max: 10 }).withMessage("NPI must be 10 digits long"),
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
    body("status").notEmpty().withMessage("Status is required").isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const { name, taxId, npi, specialities, physicalAddress, state, status } = req.body;
    try {
      const location = await Location.create({
        practice: practiceId,
        name,
        taxId,
        npi,
        specialities: specialities ? specialities : [],
        physicalAddress,
        state: state ? state : null,
        status: status,
      });
      res.json({ message: "Create successful", data: { _id: location._id, name: location.name } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/:id/locations/:lid",
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
    param("lid").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Location ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Location ID is invalid");
      }
      const location = await Location.findById(value);
      if (!location) {
        throw new Error("Location not found");
      }
      if (location.practice.toString() !== req.params.id) {
        throw new Error("Location does not belong to the specified Practice");
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
    const locationId = req.params.lid;

    try {
      const location = await Location.findById(locationId, {
        _id: 1,
        practice: 1,
        name: 1,
        taxId: 1,
        npi: 1,
        specialities: 1,
        physicalAddress: 1,
        state: 1,
        status: 1,
      })
        .populate("practice", "name")
        .populate("state", "name")
        .populate("specialities", "name");
      if (!location) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.json({ data: location });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/:id/locations/:lid",
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
    param("lid").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Location ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Location ID is invalid");
      }
      const location = await Location.findById(value);
      if (!location) {
        throw new Error("Location not found");
      }
      if (location.practice.toString() !== req.params.id) {
        throw new Error("Location does not belong to the specified Practice");
      }
      return true;
    }),
    body("name").notEmpty().withMessage("Name is required"),
    body("taxId").notEmpty().withMessage("Tax ID is required").isNumeric().withMessage("Tax ID must be a number").isLength({ min: 9, max: 9 }).withMessage("Tax ID must be 9 digits long"),
    body("npi").notEmpty().withMessage("NPI is required").isNumeric().withMessage("NPI must be a number").isLength({ min: 10, max: 10 }).withMessage("NPI must be 10 digits long"),
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
    body("status").notEmpty().withMessage("Status is required").isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const locationId = req.params.lid;
    const { name, taxId, npi, specialities, physicalAddress, state, status } = req.body;
    try {
      let location = await Location.findById(locationId);
      if (!location) {
        return res.status(404).json({ message: "Location not found." });
      }

      location.name = name;
      location.taxId = taxId;
      location.npi = npi;
      location.specialities = specialities || null;
      location.physicalAddress = physicalAddress;
      location.state = state || null;
      location.status = status;

      location = await location.save();

      res.json({ message: "Update successful", data: { _id: location._id, name: location.name } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
