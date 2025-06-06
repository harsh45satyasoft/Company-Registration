const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const Company = require("../models/Company");

// Validation middleware
const validateCompany = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("companyName").notEmpty().withMessage("Company name is required"),
  body("openingHours").notEmpty().withMessage("Opening hours is required"),
  body("closingHours").notEmpty().withMessage("Closing hours is required"),
  body("address").notEmpty().withMessage("Address is required"),
  body("latitude").isNumeric().withMessage("Valid latitude is required"),
  body("longitude").isNumeric().withMessage("Valid longitude is required"),
];

// Check email availability
router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;
    const existingCompany = await Company.findOne({
      email: email.toLowerCase(),
    });

    if (existingCompany) {
      return res.json({ available: false, message: "Email is already used" });
    }

    res.json({ available: true, message: "Email is available" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Register company
router.post("/register", validateCompany, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      email,
      password,
      companyName,
      openingHours,
      closingHours,
      address,
      latitude,
      longitude,
    } = req.body;

    // Check if email already exists
    const existingCompany = await Company.findOne({
      email: email.toLowerCase(),
    });
    if (existingCompany) {
      return res.status(400).json({
        errors: [{ field: "email", message: "Email already exists" }],
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const company = new Company({
      firstName,
      email: email.toLowerCase(),
      password: hashedPassword,
      companyName,
      openingHours,
      closingHours,
      address,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    });

    await company.save();

    res.status(201).json({
      message: "Company registered successfully",
      company: {
        id: company._id,
        firstName: company.firstName,
        email: company.email,
        companyName: company.companyName,
        address: company.address,
        location: company.location,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Get all companies (for listing)
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        companyName: { $regex: search, $options: "i" },
      };
    }

    const companies = await Company.find(query)
      .select("-password")                           // (-)Exclude password
      .sort({ createdAt: -1 }); 

    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get company by ID
router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).select("-password");
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;