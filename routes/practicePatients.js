var express = require("express");
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
var router = express.Router();
var Practice = require("../models/practice");
var Location = require("../models/location");
var Patient = require("../models/patient");
var Provider = require("../models/provider");
var Payer = require("../models/payer");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get(
  "/:id/patients",
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

      const patients = await Patient.find(
        { practice: practiceId },
        {
          _id: 1,
          practice: 1,
          location: 1,
          firstName: 1,
          lastName: 1,
          gender: 1,
          dateOfBirth: 1,
          primaryInsurance: 1,
          secondaryInsurance: 1,
          tertiaryInsurance: 1,
          primaryInsuranceName: 1,
          primaryInsuranceId: 1,
          patientAssistanceProgram: 1,
          patientAssistanceProgramName: 1,
          primaryPharmacy: 1,
          biInvestigation: 1,
          biInvestigationRemarks: 1,
          renderingProvider: 1,
          appointmentType: 1,
          accountNo: 1,
        }
      )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("practice", "name")
        .populate("location", "name")
        .populate("primaryInsurance", ["name", "payerId"])
        .populate("secondaryInsurance", ["name", "payerId"])
        .populate("tertiaryInsurance", ["name", "payerId"])
        .populate("renderingProvider", ["firstName", "lastName"]);

      const totalCount = await Patient.countDocuments({ practice: practiceId });
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        data: patients,
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
  "/:id/patients",
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
    body("location").custom(async (value, { req }) => {
      if (!value) {
        return true;
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
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("gender").optional().custom(value => {
      if (value !== '' && !['male', 'female', 'other'].includes(value)) {
        throw new Error("Gender must be 'male', 'female' or 'other'");
      }
      return true;
    }),
    body("dateOfBirth").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("DOB is required");
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("DOB must be a valid date");
      }
      return true;
    }),
    body("ssn").optional().custom(value => {
      if (value !== '' && (!/^\d{9}$/.test(value))) {
        throw new Error("SSN must be a 9-digit number");
      }
      return true;
    }),
    body("accountNo").notEmpty().withMessage("Account No is required"),
    body("primaryInsurance").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Primary Insurance is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Primary Insurance ID is invalid");
      }
      const payerExists = await Payer.findById(value);
      if (!payerExists) {
        throw new Error("Primary Insurance does not exist");
      }
      return true;
    }),
    body("secondaryInsurance").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Secondary Insurance ID is invalid");
      }
      const payerExists = await Payer.findById(value);
      if (!payerExists) {
        throw new Error("Secondary Insurance does not exist");
      }
      return true;
    }),
    body("tertiaryInsurance").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Tertiary Insurance ID is invalid");
      }
      const payerExists = await Payer.findById(value);
      if (!payerExists) {
        throw new Error("Tertiary Insurance does not exist");
      }
      return true;
    }),
    body("patientAssistanceProgram").isIn(["Yes", "No"]).withMessage("Invalid Patient Assistance Program"),
    body("patientAssistanceProgramName").custom((value, { req }) => {
      if (req.body.patientAssistanceProgram === "Yes") {
        if (!value) {
          throw new Error("Patient Assistance Program Name is required when Patient Assistance Program is 'Yes'");
        }
      }
      return true;
    }),
    body("biInvestigation").isIn(["Yes", "No"]).withMessage("Invalid BI Investigation"),
    body("biInvestigationRemarks").custom((value, { req }) => {
      if (req.body.biInvestigation === "Yes") {
        if (!value) {
          throw new Error("BI Investigation Remarks is required when BI Investigation is 'Yes'");
        }
      }
      return true;
    }),
    body("serviceDate").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("Service Date must be a valid date");
      }
      return true;
    }),
    body("renderingProvider").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Rendering Provider is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Rendering Provider ID is invalid");
      }
      const provider = await Provider.findById(value);
      if (!provider) {
        throw new Error("Rendering Provider not found");
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
    const {
      location,
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      ssn,
      accountNo,
      primaryInsurance,
      secondaryInsurance,
      tertiaryInsurance,
      patientAssistanceProgram,
      patientAssistanceProgramName,
      patientAssistanceRemarks,
      primaryPharmacy,
      primaryPharmacyDetails,
      secondaryPharmacy,
      secondaryPharmacyDetails,
      biInvestigation,
      biInvestigationRemarks,
      patientAddress,
      patientCity,
      patientState,
      patientZipCode,
      patientContactNumber,
      serviceDate,
      appointmentType,
      referringProvider,
      renderingProvider,
      reasonForVisit,
      orderStatus,
    } = req.body;
    try {
      const patient = await Patient.create({
        practice: practiceId,
        location: location,
        firstName,
        middleName,
        lastName,
        gender,
        dateOfBirth,
        ssn,
        accountNo,
        primaryInsurance,
        secondaryInsurance: secondaryInsurance ? secondaryInsurance : null,
        tertiaryInsurance: tertiaryInsurance ? tertiaryInsurance : null,
        patientAssistanceProgram,
        patientAssistanceProgramName,
        patientAssistanceRemarks,
        primaryPharmacy,
        primaryPharmacyDetails,
        secondaryPharmacy,
        secondaryPharmacyDetails,
        biInvestigation,
        biInvestigationRemarks,
        patientAddress,
        patientCity,
        patientState,
        patientZipCode,
        patientContactNumber,
        serviceDate,
        appointmentType,
        referringProvider,
        renderingProvider,
        reasonForVisit,
        orderStatus,
        status: "active",
      });
      res.json({ message: "Create successful", data: { _id: patient._id, firstName: patient.firstName, lastName: patient.lastName } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/:id/patients/:pid",
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
        throw new Error("Patient ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Patient ID is invalid");
      }
      const patient = await Patient.findById(value);
      if (!patient) {
        throw new Error("Patient not found");
      }
      if (patient.practice.toString() !== req.params.id) {
        throw new Error("Patient does not belong to the specified Practice");
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
    const patientId = req.params.pid;

    try {
      const patient = await Patient.findById(patientId, {
        _id: 1,
        practice: 1,
        location: 1,
        firstName: 1,
        middleName: 1,
        lastName: 1,
        gender: 1,
        dateOfBirth: 1,
        ssn: 1,
        accountNo: 1,
        primaryInsurance: 1,
        secondaryInsurance: 1,
        tertiaryInsurance: 1,
        primaryInsuranceName: 1,
        primaryInsuranceId: 1,
        secondaryInsuranceName: 1,
        secondaryInsuranceId: 1,
        tertiaryInsuranceName: 1,
        tertiaryInsuranceId: 1,
        patientAssistanceProgram: 1,
        patientAssistanceProgramName: 1,
        patientAssistanceRemarks: 1,
        primaryPharmacy: 1,
        primaryPharmacyDetails: 1,
        secondaryPharmacy: 1,
        secondaryPharmacyDetails: 1,
        biInvestigation: 1,
        biInvestigationRemarks: 1,
        patientAddress: 1,
        patientCity: 1,
        patientState: 1,
        patientZipCode: 1,
        patientContactNumber: 1,
        serviceDate: 1,
        appointmentType: 1,
        referringProvider: 1,
        renderingProvider: 1,
        reasonForVisit: 1,
        orderStatus: 1,
        status: 1,
      })
        .populate("practice", "name")
        .populate("location", "name")
        .populate("primaryInsurance", ["name", "payerId"])
        .populate("secondaryInsurance", ["name", "payerId"])
        .populate("tertiaryInsurance", ["name", "payerId"])
        .populate("renderingProvider", ["firstName", "lastName"]);
      if (!patient) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.json({ data: patient });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/:id/patients/:pid",
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
        throw new Error("Patient ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Patient ID is invalid");
      }
      const patient = await Patient.findById(value);
      if (!patient) {
        throw new Error("Patient not found");
      }
      if (patient.practice.toString() !== req.params.id) {
        throw new Error("Patient does not belong to the specified Practice");
      }
      return true;
    }),
    body("location").custom(async (value, { req }) => {
      if (!value) {
        return true;
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
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("gender").optional().custom(value => {
      if (value !== '' && !['male', 'female', 'other'].includes(value)) {
        throw new Error("Gender must be 'male', 'female' or 'other'");
      }
      return true;
    }),
    body("dateOfBirth").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("DOB is required");
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("DOB must be a valid date");
      }
      return true;
    }),
    body("ssn").optional().custom(value => {
      if (value !== '' && (!/^\d{9}$/.test(value))) {
        throw new Error("SSN must be a 9-digit number");
      }
      return true;
    }),
    body("accountNo").notEmpty().withMessage("Account No is required"),
    body("primaryInsurance").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Primary Insurance is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Primary Insurance ID is invalid");
      }
      const payerExists = await Payer.findById(value);
      if (!payerExists) {
        throw new Error("Primary Insurance does not exist");
      }
      return true;
    }),
    body("secondaryInsurance").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Secondary Insurance ID is invalid");
      }
      const payerExists = await Payer.findById(value);
      if (!payerExists) {
        throw new Error("Secondary Insurance does not exist");
      }
      return true;
    }),
    body("tertiaryInsurance").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Tertiary Insurance ID is invalid");
      }
      const payerExists = await Payer.findById(value);
      if (!payerExists) {
        throw new Error("Tertiary Insurance does not exist");
      }
      return true;
    }),
    body("patientAssistanceProgram").isIn(["Yes", "No"]).withMessage("Invalid Patient Assistance Program"),
    body("patientAssistanceProgramName").custom((value, { req }) => {
      if (req.body.patientAssistanceProgram === "Yes") {
        if (!value) {
          throw new Error("Patient Assistance Program Name is required when Patient Assistance Program is 'Yes'");
        }
      }
      return true;
    }),
    body("biInvestigation").isIn(["Yes", "No"]).withMessage("Invalid BI Investigation"),
    body("biInvestigationRemarks").custom((value, { req }) => {
      if (req.body.biInvestigation === "Yes") {
        if (!value) {
          throw new Error("BI Investigation Remarks is required when BI Investigation is 'Yes'");
        }
      }
      return true;
    }),
    body("serviceDate").custom(async (value, { req }) => {
      if (!value) {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("Service Date must be a valid date");
      }
      return true;
    }),
    body("renderingProvider").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Rendering Provider is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Rendering Provider ID is invalid");
      }
      const provider = await Provider.findById(value);
      if (!provider) {
        throw new Error("Rendering Provider not found");
      }
      if (provider.practice.toString() !== req.params.id) {
        throw new Error("Provider does not belong to the specified Practice");
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
    const patientId = req.params.pid;
    const {
      location,
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      ssn,
      accountNo,
      primaryInsurance,
      secondaryInsurance,
      tertiaryInsurance,
      patientAssistanceProgram,
      patientAssistanceProgramName,
      patientAssistanceRemarks,
      primaryPharmacy,
      primaryPharmacyDetails,
      secondaryPharmacy,
      secondaryPharmacyDetails,
      biInvestigation,
      biInvestigationRemarks,
      patientAddress,
      patientCity,
      patientState,
      patientZipCode,
      patientContactNumber,
      serviceDate,
      appointmentType,
      referringProvider,
      renderingProvider,
      reasonForVisit,
      orderStatus,
      status,
    } = req.body;
    try {
      let patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found." });
      }

      patient.location = location;
      patient.firstName = firstName;
      patient.middleName = middleName;
      patient.lastName = lastName;
      patient.gender = gender;
      patient.dateOfBirth = dateOfBirth;
      patient.ssn = ssn;
      patient.accountNo = accountNo;
      patient.primaryInsurance = primaryInsurance;
      patient.secondaryInsurance = secondaryInsurance || null;
      patient.tertiaryInsurance = tertiaryInsurance || null;
      patient.patientAssistanceProgram = patientAssistanceProgram;
      patient.patientAssistanceProgramName = patientAssistanceProgramName;
      patient.patientAssistanceRemarks = patientAssistanceRemarks;
      patient.primaryPharmacy = primaryPharmacy;
      patient.primaryPharmacyDetails = primaryPharmacyDetails;
      patient.secondaryPharmacy = secondaryPharmacy;
      patient.secondaryPharmacyDetails = secondaryPharmacyDetails;
      patient.biInvestigation = biInvestigation;
      patient.biInvestigationRemarks = biInvestigationRemarks;
      patient.patientAddress = patientAddress;
      patient.patientCity = patientCity;
      patient.patientState = patientState;
      patient.patientZipCode = patientZipCode;
      patient.patientContactNumber = patientContactNumber;
      patient.serviceDate = serviceDate;
      patient.appointmentType = appointmentType;
      patient.referringProvider = referringProvider;
      patient.renderingProvider = renderingProvider;
      patient.reasonForVisit = reasonForVisit;
      patient.orderStatus = orderStatus;
      patient.status = status;

      patient = await patient.save();

      res.json({ message: "Update successful", data: { _id: patient._id, firstName: patient.firstName, lastName: patient.lastName } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
