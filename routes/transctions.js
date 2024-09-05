var express = require("express");
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
var router = express.Router();
var Practice = require("../models/practice");
var Drug = require("../models/drug");
var Protocol = require("../models/protocol");
var QuarterlyProcedureCode = require("../models/quarterlyProcedureCode");
const { verifyToken } = require("../middlewares/authMiddleware");
const Transction = require("../models/transaction");

router.get("/list", verifyToken,
  [
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const transctions = await Transction.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalCount = await Transction.countDocuments({ });
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        data: transctions,
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

router.delete("/delete/:tid", verifyToken,
    [
      param("tid").custom(async (value, { req }) => {
        if (!value) {
          throw new Error("Transction ID is required");
        }
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error("Transction ID is invalid");
        }
        const transction = await Transction.findById(value);
        if (!transction) {
          throw new Error("Transction not found");
        }
        return true;
      }),
    ], async function (req, res, next) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const practiceId = req.params.id;
      const transctionId = req.params.tid;
      
      try {
        let transcaiton = await Transction.deleteOne({_id:transctionId});
          
  
        res.json({ message: "deleted successful" });
      } catch (error) {
          console.log(error);
        res.status(500).json({ message: error.message });
      }
});

router.post("/results", verifyToken,
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
      body("practiceName").custom(async (value, { req }) => {
        if (!value) {
          throw new Error("Practice Name is required");
        }
        return true;
      }),
      body("patientId").custom(async (value, { req }) => {
          if (!value) {
              throw new Error("patient Id is required");
          }
          if (!mongoose.Types.ObjectId.isValid(value)) {
              throw new Error("patient ID is invalid");
              }
          return true;
      }),
      body("dateOfService").custom(async (value, { req }) => {
          if (!value) {
              throw new Error("Date Of Service is required");
          }
          return true;
      }),
      body("protocolId").custom(async (value, { req }) => {
          if (!value) {
              throw new Error("protocol Id is required");
          }
          if (!mongoose.Types.ObjectId.isValid(value)) {
              throw new Error("protocol ID is invalid");
              }
          return true;
      }),
      body("medicalConditionName").custom(async (value, { req }) => {
          if (!value) {
              throw new Error("medical Condition Name is required");
          }
          return true;
      }),
      body("drugCode").custom(async (value, { req }) => {
          if (!value) {
              throw new Error("drug Code is required");
          }
          return true;
      }),
      body("providerId").custom(async (value, { req }) => {
          if (!value) {
              throw new Error("provider Id is required");
          }
          if (!mongoose.Types.ObjectId.isValid(value)) {
              throw new Error("provider ID is invalid");
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
          practiceName,
          patientId,
          dateOfBirth,
          account,
          dateOfService,
          year,
          quarter,
          protocolId,
          medicalConditionName,
          drugId,
          drugCode,
          units,
          providerId,
          biInvestigationRemarks,
          patientAssistanceProgramName,
          primaryInsuranceName,
          secondaryInsuranceName,
          tertiaryInsuranceName
      } = req.body;
      try {
  
        const transction = await Transction.create({
          practiceId,
          practiceName,
          patientId,
          dateOfBirth,
          account,
          dateOfService,
          year,
          quarter,
          protocolId,
          medicalConditionName,
          drugId,
          drugCode,
          units,
          providerId,
          biInvestigationRemarks,
          patientAssistanceProgramName,
          primaryInsuranceName,
          secondaryInsuranceName,
          tertiaryInsuranceName
        });
        res.json({ message: "Create successful", data: { _id: transction._id } });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
});

module.exports = router;
