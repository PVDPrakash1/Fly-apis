var express = require("express");
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
var router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const FoodType = require("../models/foodType");

router.get("/all", async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const foodTypes = await FoodType.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalCount = await FoodType.countDocuments({});
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      data: foodTypes,
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
  "/add",
  
  [
    body("name").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Name is required");
      }
      const existingFoodType = await FoodType.findOne({ name: value });
      if (existingFoodType) {
        throw new Error("Name must be unique");
      }
      return true;
    }),
    body("order").notEmpty().withMessage("Order is required"),
    body("image").notEmpty().withMessage("Image is required"),
    body("status").notEmpty().withMessage("Status is required").isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, order, status , image} = req.body;
    try {
      const foodType = await FoodType.create({
        name,
        order,
        image,
        status: status,
      });
      res.json({ message: "Create successful", data: { _id: foodType._id, name: foodType.name } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);



// router.get(
//   "/:id",
//   verifyToken,
//   [
//     param("id").custom(async (value, { req }) => {
//       if (!value) {
//         throw new Error("Practice ID is required");
//       }
//       if (!mongoose.Types.ObjectId.isValid(value)) {
//         throw new Error("Practice ID is invalid");
//       }
//       const practice = await Practice.findById(value);
//       if (!practice) {
//         throw new Error("Practice not found");
//       }
//       return true;
//     }),
//   ],
//   async function (req, res, next) {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const practiceId = req.params.id;

//     try {
//       const practice = await Practice.findById(practiceId, {
//         _id: 1,
//         name: 1,
//         shortName: 1,
//         taxId: 1,
//         npi: 1,
//         pmSystem: 1,
//         clearingHouse: 1,
//         emrName: 1,
//         drugInventory: 1,
//         state: 1,
//         physicalAddress: 1,
//         billingAddress: 1,
//         county: 1,
//         locality: 1,
//         specialities: 1,
//         status: 1,
//       })
//         .populate("county", "name")
//         .populate("state", "name")
//         .populate("specialities", "name");
//       if (!practice) {
//         return res.status(404).json({ message: "Record not found" });
//       }

//       res.json({ data: practice });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

router.put(
  "/edit/:id",
  [
    param("id").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("id ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("id ID is invalid");
      }
      const foodType = await FoodType.findById(value);
      if (!foodType) {
        throw new Error("id not found");
      }
      return true;
    }),
    body("name").notEmpty().withMessage("Name is required"),
    body("order").notEmpty().withMessage("Order is required"),
    body("image").notEmpty().withMessage("Image is required"),
    body("status").notEmpty().withMessage("Status is required").isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),
  ],
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const foodTypeId = req.params.id;
    const { name, order, status , image} = req.body;

    try {
      let foodtype = await FoodType.findById(foodTypeId);
      if (!foodtype) {
        return res.status(404).json({ message: "foodtype not found." });
      }

      foodtype.name = name;
      
      foodtype.status = status;
      foodtype.order = order;
      foodtype.image = image;

      foodtype = await foodtype.save();

      res.json({ message: "Update successful"});
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete("/delete/:tid",
  [
    param("tid").custom(async (value, { req }) => {
      if (!value) {
        throw new Error("Transction ID is required");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Transction ID is invalid");
      }
      const foodtype = await FoodType.findById(value);
      if (!foodtype) {
        throw new Error("Transction not found");
      }
      return true;
    }),
  ], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const foodTypeId = req.params.id;
    const foodTypeIds = req.params.tid;
    
    try {
      let foodType = await FoodType.deleteOne({_id:foodTypeIds});
        

      res.json({ message: "deleted successful" });
    } catch (error) {
        console.log(error);
      res.status(500).json({ message: error.message });
    }
});

module.exports = router;
