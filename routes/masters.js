var express = require("express");
var router = express.Router();
var Speciality = require("../models/speciality");
var County = require("../models/county");
var State = require("../models/state");
var Payer = require("../models/payer");
var ProcedureCode = require("../models/procedureCode");
var QuarterlyProcedureCode = require("../models/quarterlyProcedureCode");
var Protocol = require("../models/protocol");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/specialities", verifyToken, async function (req, res, next) {
  const search = req.query.search || "";
  const regex = new RegExp("^" + search, "i");
  try {
    const specialities = await Speciality.find({ name: regex, status: "active" }, { _id: 1, name: 1 });
    res.json({ data: specialities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/counties", verifyToken, async function (req, res, next) {
  const search = req.query.search || "";
  const regex = new RegExp("^" + search, "i");
  try {
    const counties = await County.find({ name: regex, status: "active" }, { _id: 1, name: 1 });
    res.json({ data: counties });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/states", verifyToken, async function (req, res, next) {
  const search = req.query.search || "";
  const regex = new RegExp("^" + search, "i");
  try {
    const states = await State.find({ name: regex, status: "active" }, { _id: 1, name: 1, code: 1 });
    res.json({ data: states });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/payers", verifyToken, async function (req, res, next) {
  const search = req.query.search || "";
  const regex = new RegExp("^" + search, "i");
  try {
    const payers = await Payer.find({ name: regex, status: "active" }, { _id: 1, name: 1, payerId: 1 });
    res.json({ data: payers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/procedure-codes", verifyToken, async function (req, res, next) {
  const search = req.query.search || "";
  const regex = new RegExp("^" + search, "i");
  try {
    const procedureCodes = await ProcedureCode.find({ hcpcsCode: regex, status: "active" }, { _id: 1, hcpcsCode: 1, shortDescription: 1 });
    res.json({ data: procedureCodes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/quarterly-procedure-codes", verifyToken, async function (req, res, next) {
  try {
    if (!req.query.year || !req.query.quarter) {
      return res.status(400).json({ message: "Please choose Year and Quarter." });
    }

    const quarterlyProcedureCodes = await QuarterlyProcedureCode.find(
      {
        year: req.query.year,
        quarter: req.query.quarter,
        status: "active",
      },
      { _id: 1, procedureCode: 1, dosage: 1, paymentLimit: 1, paymentLimitWoSeq: 1 }
    ).populate("procedureCode", ["hcpcsCode", "shortDescription"]);
    res.json({ data: quarterlyProcedureCodes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/practices/:id/protocols", verifyToken, async function (req, res, next) {
  const practiceId = req.params.id;
  try {
    if (!req.query.year || !req.query.quarter) {
      return res.status(400).json({ message: "Please choose Year and Quarter." });
    }

    const protocols = await Protocol.find(
      {
        practice: practiceId,
        year: req.query.year,
        quarter: req.query.quarter,
        status: "active",
      },
      { _id: 1, name: 1 }
    );
    res.json({ data: protocols });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
