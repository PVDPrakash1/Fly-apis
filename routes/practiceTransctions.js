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

router.get("/transctions", verifyToken,
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

router.post("/:id/transctions", verifyToken,
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
        patientName,
        dateOfBirth,
        account,
        dateOfService,
        year,
        quarter,
        protocolId,
        protocolName,
        medicalConditionName,
        drugId,
        drugCode,
        units,
        providerId,
        providerName,
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
        patientName,
        dateOfBirth,
        account,
        dateOfService,
        year,
        quarter,
        protocolId,
        protocolName,
        medicalConditionName,
        drugId,
        drugCode,
        units,
        providerId,
        providerName,
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

router.get("/:id/transctions/:tid", verifyToken,
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
      if (transction.practiceId.toString() !== req.params.id) {
        throw new Error("Transction does not belong to the specified Practice");
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
      const transction = await Transction.findById(transctionId, {
        _id: 1,
        practiceId: 1,
        practiceName: 1,
        patientId: 1,
        dateOfBirth: 1,
        account: 1,
        dateOfService: 1,
        year: 1,
        quarter: 1,
        protocolId: 1,
        medicalConditionName: 1,
        drugId: 1,
        drugCode: 1,
        units: 1,
        providerId: 1,
        biInvestigationRemarks: 1,
        patientAssistanceProgramName: 1,
        primaryInsuranceName: 1,
        secondaryInsuranceName: 1,
        tertiaryInsuranceName: 1,
        remarks: 1,
        comments: 1,
        approvedDrug: 1,
        approvedUnits: 1,
        createdAt: 1,
        updatedAt: 1,
        status: 1,
      });
      if (!transction) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.json({ data: transction });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

router.put("/:id/transctions/:tid", verifyToken,
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
      if (transction.practiceId.toString() !== req.params.id) {
        throw new Error("Transction does not belong to the specified Practice");
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
    body("status").notEmpty().withMessage("Status is required").isIn(["open", "close", "escalated"]).withMessage("Status must be 'open' or 'close' or 'escalated'"),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const practiceId = req.params.id;
    const transctionId = req.params.tid;
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
        tertiaryInsuranceName,
        status,
        remarks,
        comments,
        approvedDrug,
        approvedUnits,
    } = req.body;
    try {
      let transcaiton = await Transction.findById(transctionId);
        
      transcaiton.practiceName = practiceName,
      transcaiton.patientId = patientId,
      transcaiton.dateOfBirth = dateOfBirth,
      transcaiton.account = account,
      transcaiton.dateOfService = dateOfService,
      transcaiton.year = year,
      transcaiton.quarter = quarter,
      transcaiton.protocolId = protocolId,
      transcaiton.medicalConditionName = medicalConditionName,
      transcaiton.drugId = drugId,
      transcaiton.drugCode = drugCode,
      transcaiton.units = units,
      transcaiton.providerId = providerId,
      transcaiton.biInvestigationRemarks = biInvestigationRemarks,
      transcaiton.patientAssistanceProgramName = patientAssistanceProgramName,
      transcaiton.primaryInsuranceName = primaryInsuranceName,
      transcaiton.secondaryInsuranceName = secondaryInsuranceName,
      transcaiton.tertiaryInsuranceName = tertiaryInsuranceName,
      transcaiton.status = status,
      transcaiton.remarks = remarks,
      transcaiton.comments = comments,
      transcaiton.approvedDrug = approvedDrug,
      transcaiton.approvedUnits = approvedUnits,

      transcaiton = await transcaiton.save();

      res.json({ message: "Update successful", data: { _id: transcaiton._id } });
    } catch (error) {
        console.log(error);
      res.status(500).json({ message: error.message });
    }
  });

module.exports = router;
